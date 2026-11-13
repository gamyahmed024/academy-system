"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { createLesson, createSeries, moveLesson, cancelLesson, endSeries, ConflictError } from "@/server/services/schedule";
import { getStudent } from "@/server/services/people";
import { getSettings, recordAttendance } from "@/server/services/money";
import { run, str, optStr, num, optId, type ActionState } from "@/server/action";
import { assert, UserError } from "@/server/services/errors";
import { fmtDateTime, zonedToUtc } from "@/lib/domain/time";
import type { AttendanceState } from "@/lib/domain/rules";

/** Re-throw a scheduling conflict with the clashing dates spelled out. */
async function withConflicts<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!(e instanceof ConflictError)) throw e;
    const tz = (await getSettings(getDb())).academyTimezone;
    const list = e.conflicts.slice(0, 4).map((c) => fmtDateTime(c.startsAt, tz)).join("، ");
    throw new UserError(`${e.message}: ${list}${e.conflicts.length > 4 ? "…" : ""}`);
  }
}

async function anchorTz(f: FormData): Promise<string> {
  const db = getDb();
  const academy = (await getSettings(db)).academyTimezone;
  if (str(f, "anchor") === "student") {
    const sid = optId(f, "studentId");
    if (sid) {
      const s = await getStudent(db, sid);
      if (s) return s.timezone;
    }
  }
  return academy;
}

export async function createLessonAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const db = getDb();
  const target = { teacherId: Number(str(f, "teacherId")), studentId: optId(f, "studentId"), groupId: optId(f, "groupId") };
  const minutes = num(f, "minutes");
  const tz = await anchorTz(f);
  let go = "";
  const r = await run(() =>
    withConflicts(async () => {
      assert(Number.isInteger(target.teacherId), "اختار المدرس");
      if (str(f, "mode") === "series") {
        const weekdays = f.getAll("weekdays").map(Number);
        const res = await createSeries(
          db,
          { ...target, weekdays, localTime: str(f, "time"), anchorTimezone: tz, minutes, startDate: str(f, "startDate"), endDate: str(f, "endDate") },
          u.id,
        );
        go = target.studentId ? `/students/${target.studentId}` : "/schedule";
        return `اتعمل ${res.count} حصة`;
      }
      const l = await createLesson(db, { ...target, date: str(f, "date"), time: str(f, "time"), timezone: tz, minutes, topic: optStr(f, "topic"), free: str(f, "free") === "1" }, u.id);
      go = `/lessons/${l.id}`;
    }),
  );
  if (r?.error) return r;
  redirect(go);
}

export async function moveLessonAction(id: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const db = getDb();
  const r = await run(() =>
    withConflicts(async () => {
      const tz = str(f, "tz") || (await getSettings(db)).academyTimezone;
      await moveLesson(db, id, { date: str(f, "date"), time: str(f, "time"), timezone: tz, reason: optStr(f, "reason") }, u.id);
      return "الحصة اتنقلت، وباقي مواعيد السلسلة زي ما هي";
    }),
  );
  revalidatePath(`/lessons/${id}`);
  return r;
}

export async function cancelLessonAction(id: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(async () => {
    await cancelLesson(getDb(), id, str(f, "reason"), u.id);
    return "الحصة اتلغت ومتخصمتش من حد";
  });
  revalidatePath(`/lessons/${id}`);
  return r;
}

export async function endSeriesAction(seriesId: number, lessonId: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(async () => {
    const from = new Date(str(f, "from"));
    assert(!isNaN(from.getTime()), "التاريخ مش صحيح");
    const n = await endSeries(getDb(), seriesId, from, u.id);
    return `اتلغت ${n} حصة جاية من السلسلة`;
  });
  revalidatePath(`/lessons/${lessonId}`);
  return r;
}

export async function attendanceAction(lessonId: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const db = getDb();
  const ids = f.getAll("studentId").map(Number);
  const r = await run(async () => {
    const tz = (await getSettings(db)).academyTimezone;
    let n = 0;
    for (const sid of ids) {
      const state = str(f, `state_${sid}`) as AttendanceState;
      if (!state) continue;
      const notice = str(f, `notice_${sid}`);
      await recordAttendance(
        db,
        {
          lessonId,
          studentId: sid,
          state,
          noticeAt: state === "excused" && notice ? zonedToUtc(notice.slice(0, 10), notice.slice(11, 16), tz) : null,
          note: optStr(f, `note_${sid}`),
        },
        u.id,
      );
      n++;
    }
    assert(n > 0, "اختار حالة الحضور");
    return "اتسجل الحضور";
  });
  revalidatePath(`/lessons/${lessonId}`);
  return r;
}
