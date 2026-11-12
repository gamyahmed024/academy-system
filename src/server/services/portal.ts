import { randomInt } from "node:crypto";
import { eq, and, inArray, gte, lt, asc, ne } from "drizzle-orm";
import type { DB } from "@/db";
import { users, teachers, students, guardians, lessons, attendance, groupMembers } from "@/db/schema";
import { createUser, changePassword, type Role } from "./auth";
import { audit } from "./people";
import { recordAttendance } from "./money";
import { assert, UserError } from "./errors";
import type { AttendanceState } from "@/lib/domain/rules";

/** People who can get their own login. */
export type PortalKind = "teacher" | "student" | "guardian";
const TABLES = { teacher: teachers, student: students, guardian: guardians } as const;

/** Readable temporary password: no look-alike characters (0/O, 1/l/I). */
export function tempPassword(): string {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => abc[randomInt(abc.length)]).join("");
}

async function person(db: DB, kind: PortalKind, id: number) {
  const t = TABLES[kind];
  const [p] = await db.select({ id: t.id, name: t.name, email: t.email, timezone: t.timezone, userId: t.userId }).from(t).where(eq(t.id, id));
  assert(p, "الشخص ده مش موجود");
  return p;
}

/** The login linked to a teacher, student or guardian (or null). */
export async function portalAccount(db: DB, kind: PortalKind, id: number) {
  const p = await person(db, kind, id);
  if (!p.userId) return null;
  const [u] = await db.select({ id: users.id, email: users.email, active: users.active }).from(users).where(eq(users.id, p.userId));
  return u ?? null;
}

/**
 * Create a login for a person. Returns the password so staff can send it once;
 * it is never stored in plain text.
 */
export async function createPortalAccount(
  db: DB,
  input: { kind: PortalKind; id: number; email: string; password?: string },
  by: number | null,
): Promise<{ email: string; password: string }> {
  const p = await person(db, input.kind, input.id);
  assert(!p.userId, "الشخص ده عنده حساب بالفعل");
  const email = input.email.trim().toLowerCase();
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  assert(!taken, "الإيميل ده مستخدم في حساب تاني");
  const password = input.password || tempPassword();
  return db.transaction(async (tx) => {
    const u = await createUser(tx as unknown as DB, { name: p.name, email, password, role: input.kind as Role, timezone: p.timezone });
    const t = TABLES[input.kind];
    await tx.update(t).set({ userId: u.id }).where(eq(t.id, input.id));
    await audit(tx, by, "create", "portal_account", u.id, { kind: input.kind, personId: input.id, email });
    return { email, password };
  });
}

export async function resetPortalPassword(db: DB, kind: PortalKind, id: number, by: number | null): Promise<string> {
  const acc = await portalAccount(db, kind, id);
  assert(acc, "الشخص ده ملوش حساب");
  const password = tempPassword();
  await changePassword(db, acc.id, password);
  await audit(db, by, "update", "portal_account", acc.id, { reset: true });
  return password;
}

export async function setPortalActive(db: DB, kind: PortalKind, id: number, active: boolean, by: number | null) {
  const acc = await portalAccount(db, kind, id);
  assert(acc, "الشخص ده ملوش حساب");
  await db.update(users).set({ active }).where(eq(users.id, acc.id));
  await audit(db, by, "update", "portal_account", acc.id, { active });
}

type PortalUser = { id: number; role: Role };

/** The teacher / student / guardian row behind a logged-in portal user. */
export async function teacherOf(db: DB, u: PortalUser) {
  if (u.role !== "teacher") return null;
  const [t] = await db.select().from(teachers).where(eq(teachers.userId, u.id));
  return t ?? null;
}
export async function studentOf(db: DB, u: PortalUser) {
  if (u.role !== "student") return null;
  const [s] = await db.select().from(students).where(eq(students.userId, u.id));
  return s ?? null;
}
export async function guardianOf(db: DB, u: PortalUser) {
  if (u.role !== "guardian") return null;
  const [g] = await db.select().from(guardians).where(eq(guardians.userId, u.id));
  return g ?? null;
}

/** Student ids this portal user may see: themselves, or a guardian's children. */
export async function visibleStudentIds(db: DB, u: PortalUser): Promise<number[]> {
  if (u.role === "student") {
    const s = await studentOf(db, u);
    return s ? [s.id] : [];
  }
  if (u.role === "guardian") {
    const g = await guardianOf(db, u);
    if (!g) return [];
    return (await db.select({ id: students.id }).from(students).where(eq(students.guardianId, g.id))).map((r) => r.id);
  }
  return [];
}

/** Lessons a set of students take part in (alone or through a group), with attendance per student. */
export async function lessonsForStudents(db: DB, studentIds: number[], from: Date, to: Date) {
  if (!studentIds.length) return [];
  const memberships = await db
    .select({ groupId: groupMembers.groupId, studentId: groupMembers.studentId })
    .from(groupMembers)
    .where(inArray(groupMembers.studentId, studentIds));
  const groupIds = [...new Set(memberships.map((m) => m.groupId))];
  const rows = await db
    .select({ l: lessons, teacherName: teachers.name, teacherMeetingUrl: teachers.meetingUrl })
    .from(lessons)
    .innerJoin(teachers, eq(teachers.id, lessons.teacherId))
    .where(and(gte(lessons.startsAt, from), lt(lessons.startsAt, to)))
    .orderBy(asc(lessons.startsAt));
  const out = [];
  for (const r of rows) {
    const who = r.l.studentId
      ? studentIds.filter((s) => s === r.l.studentId)
      : groupIds.includes(r.l.groupId!)
        ? memberships.filter((m) => m.groupId === r.l.groupId).map((m) => m.studentId)
        : [];
    for (const studentId of who) {
      out.push({ ...r.l, studentId, teacherName: r.teacherName, joinUrl: r.l.meetingUrl ?? r.teacherMeetingUrl });
    }
  }
  if (!out.length) return [];
  const att = await db
    .select()
    .from(attendance)
    .where(inArray(attendance.lessonId, [...new Set(out.map((l) => l.id))]));
  return out.map((l) => ({ ...l, attendance: att.find((a) => a.lessonId === l.id && a.studentId === l.studentId) ?? null }));
}

/**
 * A student or guardian excuses a student from an upcoming lesson. The notice
 * time is now, so the academy's free-cancellation policy decides the deduction.
 */
export async function excuseLesson(db: DB, u: PortalUser, lessonId: number, studentId: number) {
  const allowed = await visibleStudentIds(db, u);
  assert(allowed.includes(studentId), "مش مسموح");
  const [l] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  assert(l && l.status !== "cancelled", "الحصة دي مش متاحة");
  assert(l.startsAt.getTime() > Date.now(), "الحصة بدأت أو خلصت، كلم الأكاديمية");
  const [existing] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.lessonId, lessonId), eq(attendance.studentId, studentId)));
  assert(!existing, "الحصة دي متسجلة بالفعل");
  return recordAttendance(db, { lessonId, studentId, state: "excused", noticeAt: new Date(), note: null }, u.id);
}

const TEACHER_STATES: AttendanceState[] = ["present", "late", "absent", "teacher_cancelled"];

/** A teacher records attendance, only for their own lessons. */
export async function teacherRecordAttendance(
  db: DB,
  u: PortalUser,
  input: { lessonId: number; studentId: number; state: AttendanceState; note?: string | null },
) {
  const t = await teacherOf(db, u);
  assert(t, "مش مسموح");
  const [l] = await db.select().from(lessons).where(and(eq(lessons.id, input.lessonId), eq(lessons.teacherId, t.id)));
  assert(l, "الحصة دي مش بتاعتك");
  if (!TEACHER_STATES.includes(input.state)) throw new UserError("الاعتذار بيتسجل من الأكاديمية");
  const [existing] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.lessonId, l.id), eq(attendance.studentId, input.studentId)));
  // staff-recorded excuses stay as staff left them
  assert(!existing || existing.state !== "excused", "الطالب ده اعتذر، والتعديل من الأكاديمية");
  return recordAttendance(db, { ...input, noticeAt: null }, u.id);
}

/** Upcoming + recent lessons of a teacher. */
export async function teacherLessons(db: DB, teacherId: number, from: Date, to: Date) {
  return db
    .select()
    .from(lessons)
    .where(and(eq(lessons.teacherId, teacherId), gte(lessons.startsAt, from), lt(lessons.startsAt, to), ne(lessons.status, "cancelled")))
    .orderBy(asc(lessons.startsAt));
}
