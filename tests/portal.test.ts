/**
 * Phase 2: logins for teachers, students and guardians, and what each may see or do.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DateTime } from "luxon";
import { testDb, resetDb, closeDb } from "./db";
import type { DB } from "@/db";
import { createGuardian, createStudent, createTeacher, createGroup, walletBalance } from "@/server/services/people";
import { createLesson } from "@/server/services/schedule";
import { recordPayment } from "@/server/services/money";
import { createUser, verifyLogin } from "@/server/services/auth";
import {
  createPortalAccount,
  resetPortalPassword,
  setPortalActive,
  teacherOf,
  studentOf,
  guardianOf,
  visibleStudentIds,
  lessonsForStudents,
  excuseLesson,
  teacherRecordAttendance,
  tempPassword,
} from "@/server/services/portal";
import { UserError } from "@/server/services/errors";

let db: DB;
const ids: Record<string, number> = {};
const users: Record<string, { id: number; role: "teacher" | "student" | "guardian" }> = {};

/** "YYYY-MM-DD" and "HH:mm" in Cairo, `hours` from now (rounded to the minute). */
function at(hours: number) {
  const d = DateTime.now().setZone("Africa/Cairo").plus({ hours }).startOf("minute");
  return { date: d.toISODate()!, time: d.toFormat("HH:mm"), timezone: "Africa/Cairo" };
}

async function login(kind: "teacher" | "student" | "guardian", id: number, email: string) {
  const acc = await createPortalAccount(db, { kind, id, email }, ids.admin);
  const u = await verifyLogin(db, email, acc.password);
  expect(u?.role).toBe(kind);
  return { id: u!.id, role: kind };
}

beforeAll(async () => {
  db = await testDb();
  await resetDb(db);
  ids.admin = (await createUser(db, { name: "عمر", email: "admin@test.local", password: "password123", role: "admin" })).id;
  ids.sara = (await createTeacher(db, { name: "أ. سارة", timezone: "Africa/Cairo", payPerLessonEgp: "250", meetingUrl: "https://meet.google.com/abc" }, ids.admin)).id;
  ids.omar = (await createTeacher(db, { name: "أ. عمرو", timezone: "Africa/Cairo", payPerLessonEgp: "200" }, ids.admin)).id;
  ids.smith = (await createGuardian(db, { name: "Mrs. Smith", timezone: "Europe/London" }, ids.admin)).id;
  ids.liam = (await createStudent(db, { name: "Liam", timezone: "Europe/London", guardianId: ids.smith }, ids.admin)).id;
  ids.noah = (await createStudent(db, { name: "Noah", timezone: "Europe/London", guardianId: ids.smith }, ids.admin)).id;
  ids.emma = (await createStudent(db, { name: "Emma", timezone: "Europe/Berlin" }, ids.admin)).id;
  ids.group = (await createGroup(db, { name: "مجموعة", teacherId: ids.omar, studentIds: [ids.emma, ids.noah] }, ids.admin)).id;

  // Liam: one lesson in 3 days (free to excuse) and one in 5 hours (late notice)
  ids.liamFar = (await createLesson(db, { teacherId: ids.sara, studentId: ids.liam, minutes: 30, ...at(72) }, ids.admin)).id;
  ids.liamSoon = (await createLesson(db, { teacherId: ids.sara, studentId: ids.liam, minutes: 30, ...at(5) }, ids.admin)).id;
  // Emma: a lesson that already happened, and a group lesson with Noah
  ids.emmaPast = (await createLesson(db, { teacherId: ids.sara, studentId: ids.emma, minutes: 30, ...at(-3) }, ids.admin)).id;
  ids.groupLesson = (await createLesson(db, { teacherId: ids.omar, groupId: ids.group, minutes: 60, ...at(48) }, ids.admin)).id;

  await recordPayment(db, { studentId: ids.liam, amount: "100", currency: "GBP", rateToEgp: "62", lessonsCredited: 8, paidOn: "2026-11-01", method: "bank" }, ids.admin);

  users.sara = await login("teacher", ids.sara, "sara@test.local");
  users.liam = await login("student", ids.liam, "liam@test.local");
  users.smith = await login("guardian", ids.smith, "smith@test.local");
  users.emma = await login("student", ids.emma, "emma@test.local");
});

afterAll(async () => {
  await closeDb();
});

describe("accounts", () => {
  it("links each login to its person", async () => {
    expect((await teacherOf(db, users.sara))?.id).toBe(ids.sara);
    expect((await studentOf(db, users.liam))?.id).toBe(ids.liam);
    expect((await guardianOf(db, users.smith))?.id).toBe(ids.smith);
    // a role never resolves to another kind of person
    expect(await teacherOf(db, users.liam)).toBeNull();
    expect(await studentOf(db, users.smith)).toBeNull();
  });

  it("refuses a second account for the same person, or a taken email", async () => {
    await expect(createPortalAccount(db, { kind: "student", id: ids.liam, email: "other@test.local" }, ids.admin)).rejects.toThrow(UserError);
    await expect(createPortalAccount(db, { kind: "student", id: ids.noah, email: "LIAM@test.local" }, ids.admin)).rejects.toThrow("مستخدم");
  });

  it("resets a password and can switch an account off", async () => {
    const p = await resetPortalPassword(db, "student", ids.emma, ids.admin);
    expect(await verifyLogin(db, "emma@test.local", p)).not.toBeNull();
    await setPortalActive(db, "student", ids.emma, false, ids.admin);
    expect(await verifyLogin(db, "emma@test.local", p)).toBeNull();
    await setPortalActive(db, "student", ids.emma, true, ids.admin);
    expect(await verifyLogin(db, "emma@test.local", p)).not.toBeNull();
  });

  it("makes readable temporary passwords", () => {
    const p = tempPassword();
    expect(p).toHaveLength(10);
    expect(p).not.toMatch(/[01OIl]/);
  });
});

describe("who sees what", () => {
  it("a student sees only themselves; a guardian sees their children", async () => {
    expect(await visibleStudentIds(db, users.liam)).toEqual([ids.liam]);
    expect((await visibleStudentIds(db, users.smith)).sort()).toEqual([ids.liam, ids.noah].sort());
    expect(await visibleStudentIds(db, users.sara)).toEqual([]);
  });

  it("lists a guardian's lessons, including a group lesson, without other group members", async () => {
    const from = new Date(Date.now() - 86_400_000);
    const to = new Date(Date.now() + 7 * 86_400_000);
    const rows = await lessonsForStudents(db, await visibleStudentIds(db, users.smith), from, to);
    const group = rows.filter((r) => r.id === ids.groupLesson);
    expect(group.map((r) => r.studentId)).toEqual([ids.noah]); // Emma is in the group but not his child
    expect(rows.filter((r) => r.studentId === ids.liam)).toHaveLength(2);
    expect(rows.find((r) => r.id === ids.liamFar)?.joinUrl).toBe("https://meet.google.com/abc");
  });
});

describe("excuses from the portal", () => {
  it("an early excuse is free", async () => {
    const before = await walletBalance(db, (await studentOf(db, users.liam))!.walletId);
    const r = await excuseLesson(db, users.liam, ids.liamFar, ids.liam);
    expect(r.deducted).toBe(false);
    expect(await walletBalance(db, (await studentOf(db, users.liam))!.walletId)).toBe(before);
  });

  it("a late excuse (by the guardian) is deducted from the family wallet", async () => {
    const g = (await guardianOf(db, users.smith))!;
    const before = await walletBalance(db, g.walletId);
    const r = await excuseLesson(db, users.smith, ids.liamSoon, ids.liam);
    expect(r.deducted).toBe(true);
    expect(await walletBalance(db, g.walletId)).toBe(before - 1);
  });

  it("cannot excuse twice, someone else's lesson, or a lesson that started", async () => {
    await expect(excuseLesson(db, users.liam, ids.liamFar, ids.liam)).rejects.toThrow("متسجلة");
    await expect(excuseLesson(db, users.liam, ids.groupLesson, ids.noah)).rejects.toThrow("مش مسموح");
    await expect(excuseLesson(db, users.emma, ids.emmaPast, ids.emma)).rejects.toThrow("بدأت");
  });
});

describe("teacher attendance", () => {
  it("records attendance for their own lesson", async () => {
    const r = await teacherRecordAttendance(db, users.sara, { lessonId: ids.emmaPast, studentId: ids.emma, state: "present" });
    expect(r.deducted).toBe(true);
    expect(r.teacherPaid).toBe(true);
  });

  it("cannot touch another teacher's lesson, record excuses, or overwrite an excuse", async () => {
    await expect(teacherRecordAttendance(db, users.sara, { lessonId: ids.groupLesson, studentId: ids.emma, state: "present" })).rejects.toThrow("بتاعتك");
    await expect(teacherRecordAttendance(db, users.sara, { lessonId: ids.emmaPast, studentId: ids.emma, state: "excused" })).rejects.toThrow(UserError);
    await expect(teacherRecordAttendance(db, users.sara, { lessonId: ids.liamFar, studentId: ids.liam, state: "teacher_cancelled" })).rejects.toThrow("اعتذر");
  });

  it("cannot mark present before the lesson starts", async () => {
    // Liam's soon lesson was excused, so use a fresh future lesson
    const id = (await createLesson(db, { teacherId: ids.sara, studentId: ids.emma, minutes: 30, ...at(30) }, ids.admin)).id;
    await expect(teacherRecordAttendance(db, users.sara, { lessonId: id, studentId: ids.emma, state: "present" })).rejects.toThrow("مبدأتش");
  });
});
