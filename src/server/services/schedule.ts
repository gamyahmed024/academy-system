import { and, eq, gte, lt, ne, inArray, or, asc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { DB } from "@/db";
import { lessons, series, teachers, students, groups, groupMembers, attendance } from "@/db/schema";
import { expandWeekly, overlaps, zonedToUtc } from "@/lib/domain/time";
import { assert, UserError } from "./errors";
import { audit, groupStudentIds } from "./people";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type Conn = DB | Tx;

export type Conflict = { lessonId: number; startsAt: Date; who: "teacher" | "student"; name: string };

/** Students attending a lesson: the single student, or the group members. */
async function studentsOf(db: Conn, studentId: number | null, groupId: number | null): Promise<number[]> {
  if (studentId) return [studentId];
  if (groupId) return groupStudentIds(db, groupId);
  return [];
}

/**
 * Find scheduled lessons that overlap any of the candidate slots, for the
 * teacher or any of the students. `ignoreLessonIds` lets a moved lesson skip itself.
 */
export async function findConflicts(
  db: Conn,
  opts: {
    teacherId: number;
    studentIds: number[];
    slots: { startsAt: Date; minutes: number }[];
    ignoreLessonIds?: number[];
  },
): Promise<Conflict[]> {
  if (!opts.slots.length) return [];
  const min = new Date(Math.min(...opts.slots.map((s) => s.startsAt.getTime())) - 24 * 3600_000);
  const max = new Date(Math.max(...opts.slots.map((s) => s.startsAt.getTime())) + 24 * 3600_000);

  const gm = alias(groupMembers, "gm");
  const rows = await db
    .select({
      id: lessons.id,
      startsAt: lessons.startsAt,
      minutes: lessons.minutes,
      teacherId: lessons.teacherId,
      studentId: lessons.studentId,
      groupStudent: gm.studentId,
    })
    .from(lessons)
    .leftJoin(gm, eq(gm.groupId, lessons.groupId))
    .where(
      and(
        ne(lessons.status, "cancelled"),
        gte(lessons.startsAt, min),
        lt(lessons.startsAt, max),
        opts.studentIds.length
          ? or(
              eq(lessons.teacherId, opts.teacherId),
              inArray(lessons.studentId, opts.studentIds),
              inArray(gm.studentId, opts.studentIds),
            )
          : eq(lessons.teacherId, opts.teacherId),
      ),
    );

  const ignore = new Set(opts.ignoreLessonIds ?? []);
  const studentSet = new Set(opts.studentIds);
  const out: Conflict[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (ignore.has(r.id)) continue;
    for (const s of opts.slots) {
      if (!overlaps(s.startsAt, s.minutes, r.startsAt, r.minutes)) continue;
      let who: "teacher" | "student" | null = null;
      if (r.teacherId === opts.teacherId) who = "teacher";
      else if ((r.studentId && studentSet.has(r.studentId)) || (r.groupStudent && studentSet.has(r.groupStudent)))
        who = "student";
      if (!who) continue;
      const key = `${r.id}:${who}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ lessonId: r.id, startsAt: r.startsAt, who, name: "" });
    }
  }
  return out;
}

export class ConflictError extends UserError {
  constructor(public conflicts: Conflict[]) {
    super(
      conflicts.some((c) => c.who === "teacher")
        ? `المدرس عنده حصة تانية في نفس الوقت (${conflicts.length} تعارض)`
        : `الطالب عنده حصة تانية في نفس الوقت (${conflicts.length} تعارض)`,
    );
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
function checkDateTime(date: string, time: string) {
  assert(DATE_RE.test(date), "التاريخ مش صحيح");
  assert(TIME_RE.test(time), "الوقت مش صحيح");
}

type Target = { teacherId: number; studentId?: number | null; groupId?: number | null };

async function checkTarget(db: Conn, t: Target) {
  assert(!!t.studentId !== !!t.groupId, "اختار طالب أو مجموعة");
  const [teacher] = await db.select().from(teachers).where(eq(teachers.id, t.teacherId));
  assert(teacher, "المدرس مش موجود");
  if (t.studentId) {
    const [s] = await db.select().from(students).where(eq(students.id, t.studentId));
    assert(s, "الطالب مش موجود");
  }
  if (t.groupId) {
    const [g] = await db.select().from(groups).where(eq(groups.id, t.groupId));
    assert(g, "المجموعة مش موجودة");
  }
}

export async function createLesson(
  db: DB,
  input: Target & { date: string; time: string; timezone: string; minutes: number; topic?: string | null },
  by: number | null,
) {
  assert(input.minutes >= 15 && input.minutes <= 240, "مدة الحصة لازم تكون بين 15 و240 دقيقة");
  checkDateTime(input.date, input.time);
  return db.transaction(async (tx) => {
    await checkTarget(tx, input);
    const startsAt = zonedToUtc(input.date, input.time, input.timezone);
    const sIds = await studentsOf(tx, input.studentId ?? null, input.groupId ?? null);
    const conflicts = await findConflicts(tx, {
      teacherId: input.teacherId,
      studentIds: sIds,
      slots: [{ startsAt, minutes: input.minutes }],
    });
    if (conflicts.length) throw new ConflictError(conflicts);
    const [l] = await tx
      .insert(lessons)
      .values({
        teacherId: input.teacherId,
        studentId: input.studentId ?? null,
        groupId: input.groupId ?? null,
        startsAt,
        minutes: input.minutes,
        topic: input.topic ?? null,
      })
      .returning();
    await audit(tx, by, "create", "lesson", l.id);
    return l;
  });
}

/**
 * Create a weekly series and materialise its lessons. The wall-clock time is
 * anchored to the student's timezone (or the academy's for groups), which the
 * simulation showed keeps the student's time stable across DST.
 */
export async function createSeries(
  db: DB,
  input: Target & {
    weekdays: number[];
    localTime: string;
    anchorTimezone: string;
    minutes: number;
    startDate: string;
    endDate: string;
  },
  by: number | null,
) {
  assert(input.weekdays.length > 0, "اختار يوم واحد على الأقل");
  assert(input.weekdays.every((d) => d >= 1 && d <= 7), "أيام الأسبوع مش صحيحة");
  assert(input.minutes >= 15 && input.minutes <= 240, "مدة الحصة لازم تكون بين 15 و240 دقيقة");
  checkDateTime(input.startDate, input.localTime);
  assert(DATE_RE.test(input.endDate), "تاريخ النهاية مش صحيح");
  assert(input.startDate <= input.endDate, "تاريخ النهاية لازم يكون بعد البداية");
  const starts = expandWeekly({
    weekdays: input.weekdays,
    localTime: input.localTime,
    timezone: input.anchorTimezone,
    startDate: input.startDate,
    endDate: input.endDate,
  });
  assert(starts.length > 0, "مفيش ولا حصة في الفترة دي");
  assert(starts.length <= 400, "الفترة طويلة جدًا، اختار فترة أقصر");

  return db.transaction(async (tx) => {
    await checkTarget(tx, input);
    const sIds = await studentsOf(tx, input.studentId ?? null, input.groupId ?? null);
    const conflicts = await findConflicts(tx, {
      teacherId: input.teacherId,
      studentIds: sIds,
      slots: starts.map((startsAt) => ({ startsAt, minutes: input.minutes })),
    });
    if (conflicts.length) throw new ConflictError(conflicts);
    const [s] = await tx
      .insert(series)
      .values({
        teacherId: input.teacherId,
        studentId: input.studentId ?? null,
        groupId: input.groupId ?? null,
        weekdays: [...input.weekdays].sort(),
        localTime: input.localTime,
        anchorTimezone: input.anchorTimezone,
        minutes: input.minutes,
        startDate: input.startDate,
        endDate: input.endDate,
      })
      .returning();
    await tx.insert(lessons).values(
      starts.map((startsAt) => ({
        seriesId: s.id,
        teacherId: input.teacherId,
        studentId: input.studentId ?? null,
        groupId: input.groupId ?? null,
        startsAt,
        minutes: input.minutes,
      })),
    );
    await audit(tx, by, "create", "series", s.id, { lessons: starts.length });
    return { series: s, count: starts.length };
  });
}

async function lockLesson(tx: Tx, id: number) {
  const [l] = await tx.select().from(lessons).where(eq(lessons.id, id)).for("update");
  assert(l, "الحصة مش موجودة");
  return l;
}

async function hasAttendance(tx: Tx, lessonId: number) {
  const [r] = await tx.select({ n: sql<number>`count(*)::int` }).from(attendance).where(eq(attendance.lessonId, lessonId));
  return r.n > 0;
}

/** Move one lesson (also a single occurrence of a series) without touching the rest. */
export async function moveLesson(
  db: DB,
  id: number,
  input: { date: string; time: string; timezone: string; minutes?: number; reason?: string | null },
  by: number | null,
) {
  checkDateTime(input.date, input.time);
  return db.transaction(async (tx) => {
    const l = await lockLesson(tx, id);
    assert(l.status === "scheduled", "مينفعش تنقل حصة اتلغت أو اتسجل حضورها");
    assert(!(await hasAttendance(tx, id)), "الحصة دي اتسجل فيها حضور");
    const startsAt = zonedToUtc(input.date, input.time, input.timezone);
    const minutes = input.minutes ?? l.minutes;
    const sIds = await studentsOf(tx, l.studentId, l.groupId);
    const conflicts = await findConflicts(tx, {
      teacherId: l.teacherId,
      studentIds: sIds,
      slots: [{ startsAt, minutes }],
      ignoreLessonIds: [id],
    });
    if (conflicts.length) throw new ConflictError(conflicts);
    await tx
      .update(lessons)
      .set({ startsAt, minutes, originalStartsAt: l.originalStartsAt ?? l.startsAt, cancelReason: input.reason ?? null })
      .where(eq(lessons.id, id));
    await audit(tx, by, "move", "lesson", id, { from: l.startsAt, to: startsAt, reason: input.reason });
  });
}

/** Cancel one lesson by the academy (no attendance, no deduction). */
export async function cancelLesson(db: DB, id: number, reason: string, by: number | null) {
  assert(reason.trim(), "اكتب سبب الإلغاء");
  return db.transaction(async (tx) => {
    const l = await lockLesson(tx, id);
    assert(l.status === "scheduled", "الحصة دي مش في حالة مجدولة");
    assert(!(await hasAttendance(tx, id)), "الحصة دي اتسجل فيها حضور");
    await tx.update(lessons).set({ status: "cancelled", cancelReason: reason.trim() }).where(eq(lessons.id, id));
    await audit(tx, by, "cancel", "lesson", id, { reason });
  });
}

/** Cancel every remaining scheduled lesson of a series from a date on. */
export async function endSeries(db: DB, seriesId: number, from: Date, by: number | null) {
  return db.transaction(async (tx) => {
    const res = await tx
      .update(lessons)
      .set({ status: "cancelled", cancelReason: "انتهاء السلسلة" })
      .where(and(eq(lessons.seriesId, seriesId), eq(lessons.status, "scheduled"), gte(lessons.startsAt, from)))
      .returning({ id: lessons.id });
    await audit(tx, by, "end", "series", seriesId, { cancelled: res.length });
    return res.length;
  });
}

export type LessonRow = Awaited<ReturnType<typeof listLessons>>[number];

export async function listLessons(
  db: DB,
  opts: { from: Date; to: Date; teacherId?: number; studentId?: number; includeCancelled?: boolean },
) {
  const conds = [gte(lessons.startsAt, opts.from), lt(lessons.startsAt, opts.to)];
  if (!opts.includeCancelled) conds.push(ne(lessons.status, "cancelled"));
  if (opts.teacherId) conds.push(eq(lessons.teacherId, opts.teacherId));
  if (opts.studentId) {
    const gIds = (
      await db.select({ g: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.studentId, opts.studentId))
    ).map((r) => r.g);
    conds.push(
      gIds.length ? or(eq(lessons.studentId, opts.studentId), inArray(lessons.groupId, gIds))! : eq(lessons.studentId, opts.studentId),
    );
  }
  const rows = await db
    .select({
      l: lessons,
      teacherName: teachers.name,
      teacherMeetingUrl: teachers.meetingUrl,
      studentName: students.name,
      studentTimezone: students.timezone,
      studentWhatsapp: students.whatsapp,
      groupName: groups.name,
      recorded: sql<number>`(select count(*)::int from ${attendance} a where a.lesson_id = ${lessons.id})`,
    })
    .from(lessons)
    .innerJoin(teachers, eq(teachers.id, lessons.teacherId))
    .leftJoin(students, eq(students.id, lessons.studentId))
    .leftJoin(groups, eq(groups.id, lessons.groupId))
    .where(and(...conds))
    .orderBy(asc(lessons.startsAt));
  return rows.map((r) => ({
    ...r.l,
    teacherName: r.teacherName,
    studentName: r.studentName,
    studentTimezone: r.studentTimezone,
    studentWhatsapp: r.studentWhatsapp,
    groupName: r.groupName,
    title: r.studentName ?? r.groupName ?? "",
    joinUrl: r.l.meetingUrl ?? r.teacherMeetingUrl,
    recorded: r.recorded,
  }));
}

export async function getLesson(db: DB, id: number) {
  const [r] = await db
    .select({
      l: lessons,
      teacher: teachers,
      studentName: students.name,
      studentTimezone: students.timezone,
      studentWhatsapp: students.whatsapp,
      groupName: groups.name,
      series: series,
    })
    .from(lessons)
    .innerJoin(teachers, eq(teachers.id, lessons.teacherId))
    .leftJoin(students, eq(students.id, lessons.studentId))
    .leftJoin(groups, eq(groups.id, lessons.groupId))
    .leftJoin(series, eq(series.id, lessons.seriesId))
    .where(eq(lessons.id, id));
  if (!r) return null;
  const participants = r.l.studentId
    ? await db.select().from(students).where(eq(students.id, r.l.studentId))
    : await db
        .select({ s: students })
        .from(groupMembers)
        .innerJoin(students, eq(students.id, groupMembers.studentId))
        .where(eq(groupMembers.groupId, r.l.groupId!))
        .then((rows) => rows.map((x) => x.s));
  const att = await db.select().from(attendance).where(eq(attendance.lessonId, id));
  return {
    ...r.l,
    teacher: r.teacher,
    studentName: r.studentName,
    studentTimezone: r.studentTimezone,
    studentWhatsapp: r.studentWhatsapp,
    groupName: r.groupName,
    series: r.series,
    title: r.studentName ?? r.groupName ?? "",
    joinUrl: r.l.meetingUrl ?? r.teacher.meetingUrl,
    participants,
    attendance: att,
  };
}
