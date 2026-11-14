/**
 * Deleting test people one by one, and wiping all trial data before going live.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { testDb, resetDb, closeDb } from "./db";
import type { DB } from "@/db";
import {
  users, students, teachers, guardians, wallets, lessons, attendance, payments, creditEntries,
  groups, groupMembers, series, payouts, trialRequests, settings, pricePlans,
} from "@/db/schema";
import { createGuardian, createStudent, createTeacher, createGroup, walletBalance } from "@/server/services/people";
import { createLesson, createSeries } from "@/server/services/schedule";
import { recordAttendance, recordPayment, getSettings, closeTeacherMonth } from "@/server/services/money";
import { createUser, verifyLogin, startSession, userForToken } from "@/server/services/auth";
import { createPortalAccount } from "@/server/services/portal";
import { createTrialRequest, linkRequestToStudent, addPricePlan } from "@/server/services/requests";
import { deleteStudent, deleteTeacher, deleteGuardian, wipeTrialData, studentFootprint, WIPE_CONFIRM_WORD } from "@/server/services/cleanup";
import { UserError } from "@/server/services/errors";

let db: DB;
let admin: number;

const visitor = (name: string, email: string) => ({
  name, email, whatsapp: "", country: "Germany", timezone: "Europe/Berlin", level: "none", forWhom: "me", preferredTimes: "", message: "", lang: "de",
});

const lesson = (teacherId: number, studentId: number | null, date: string, extra: object = {}) =>
  createLesson(db, { teacherId, studentId: studentId ?? undefined, date, time: "10:00", timezone: "Africa/Cairo", minutes: 30, ...extra }, admin);

beforeAll(async () => {
  db = await testDb();
  await resetDb(db);
  admin = (await createUser(db, { name: "عمر", email: "admin@test.local", password: "password123", role: "admin" })).id;
  await getSettings(db);
});
afterAll(closeDb);

describe("delete a student", () => {
  it("removes the student with lessons, attendance, payments, wallet and login", async () => {
    const t = await createTeacher(db, { name: "مدرس", timezone: "Africa/Cairo", payPerLessonEgp: "100" }, admin);
    const s = await createStudent(db, { name: "Test Student", email: "s@test.local", timezone: "Europe/Berlin" }, admin);
    const other = await createStudent(db, { name: "Other", timezone: "Europe/Berlin" }, admin);
    await recordPayment(db, { studentId: s.id, amount: "100", currency: "EUR", rateToEgp: "55", lessonsCredited: 4, method: "PayPal", paidOn: "2026-10-01" }, admin);
    const l1 = await lesson(t.id, s.id, "2026-10-05");
    await recordAttendance(db, { lessonId: l1.id, studentId: s.id, state: "present" }, admin);
    await createSeries(db, { teacherId: t.id, studentId: s.id, weekdays: [3], localTime: "12:00", anchorTimezone: "Africa/Cairo", minutes: 30, startDate: "2026-10-01", endDate: "2026-10-31" }, admin);
    const g = await createGroup(db, { name: "مجموعة", teacherId: t.id, studentIds: [s.id, other.id] }, admin);
    const gl = await lesson(t.id, null, "2026-10-06", { groupId: g.id });
    await recordAttendance(db, { lessonId: gl.id, studentId: s.id, state: "present" }, admin);
    await recordAttendance(db, { lessonId: gl.id, studentId: other.id, state: "absent" }, admin);
    const acc = await createPortalAccount(db, { kind: "student", id: s.id, email: "s@test.local" }, admin);
    const u = await verifyLogin(db, "s@test.local", acc.password);
    const { token } = await startSession(db, u!.id);
    await createTrialRequest(db, visitor("Test Student", "s@test.local"));
    const [req] = await db.select().from(trialRequests);
    await linkRequestToStudent(db, req.id, s.id);

    expect(await studentFootprint(db, s.id)).toEqual({ lessons: 5, attendance: 2, payments: 1 });
    await deleteStudent(db, s.id, admin);

    expect(await db.select().from(students).where(eq(students.id, s.id))).toEqual([]);
    expect(await db.select().from(wallets).where(eq(wallets.id, s.walletId))).toEqual([]);
    expect(await db.select().from(payments).where(eq(payments.walletId, s.walletId))).toEqual([]);
    expect(await db.select().from(creditEntries).where(eq(creditEntries.walletId, s.walletId))).toEqual([]);
    expect(await db.select().from(lessons).where(eq(lessons.studentId, s.id))).toEqual([]);
    expect(await db.select().from(series).where(eq(series.studentId, s.id))).toEqual([]);
    expect(await db.select().from(attendance).where(eq(attendance.studentId, s.id))).toEqual([]);
    expect(await db.select().from(users).where(eq(users.id, u!.id))).toEqual([]);
    expect(await userForToken(db, token)).toBeNull();
    // the group lesson and the other student stay
    expect(await db.select().from(lessons).where(eq(lessons.id, gl.id))).toHaveLength(1);
    expect(await db.select().from(attendance).where(eq(attendance.studentId, other.id))).toHaveLength(1);
    expect(await db.select().from(groupMembers).where(eq(groupMembers.groupId, g.id))).toEqual([{ groupId: g.id, studentId: other.id }]);
    // the visitor's request stays, unlinked
    const [r2] = await db.select().from(trialRequests).where(eq(trialRequests.id, req.id));
    expect(r2.studentId).toBeNull();
  });

  it("in a family, keeps the family wallet and the siblings", async () => {
    const fam = await createGuardian(db, { name: "Mrs. Smith", timezone: "Europe/London" }, admin);
    const a = await createStudent(db, { name: "Liam", timezone: "Europe/London", guardianId: fam.id }, admin);
    const b = await createStudent(db, { name: "Noah", timezone: "Europe/London", guardianId: fam.id }, admin);
    await recordPayment(db, { guardianId: fam.id, amount: "80", currency: "GBP", rateToEgp: "65", lessonsCredited: 4, method: "Wise", paidOn: "2026-10-01" }, admin);
    await deleteStudent(db, a.id, admin);
    expect(await walletBalance(db, fam.walletId)).toBe(4);
    expect(await db.select().from(students).where(eq(students.id, b.id))).toHaveLength(1);
  });

  it("says so when the student is already gone", async () => {
    await expect(deleteStudent(db, 99999, admin)).rejects.toBeInstanceOf(UserError);
  });
});

describe("delete a family", () => {
  it("removes the guardian, the children, the shared wallet and the logins", async () => {
    const fam = await createGuardian(db, { name: "Familie Weber", timezone: "Europe/Berlin" }, admin);
    const k = await createStudent(db, { name: "Lena", timezone: "Europe/Berlin", guardianId: fam.id }, admin);
    await recordPayment(db, { guardianId: fam.id, amount: "100", currency: "EUR", rateToEgp: "55", lessonsCredited: 4, method: "PayPal", paidOn: "2026-10-01" }, admin);
    const acc = await createPortalAccount(db, { kind: "guardian", id: fam.id, email: "weber@test.local" }, admin);
    await deleteGuardian(db, fam.id, admin);
    expect(await db.select().from(guardians).where(eq(guardians.id, fam.id))).toEqual([]);
    expect(await db.select().from(students).where(eq(students.id, k.id))).toEqual([]);
    expect(await db.select().from(wallets).where(eq(wallets.id, fam.walletId))).toEqual([]);
    expect(await verifyLogin(db, "weber@test.local", acc.password)).toBeNull();
  });
});

describe("delete a teacher", () => {
  it("removes lessons, groups, payouts and login, and gives the students their credit back", async () => {
    const t = await createTeacher(db, { name: "أ. تجربة", timezone: "Africa/Cairo", payPerLessonEgp: "150" }, admin);
    const s = await createStudent(db, { name: "Kept", timezone: "Europe/Paris" }, admin);
    await recordPayment(db, { studentId: s.id, amount: "50", currency: "EUR", rateToEgp: "55", lessonsCredited: 2, method: "PayPal", paidOn: "2026-09-01" }, admin);
    const l = await lesson(t.id, s.id, "2026-09-10");
    await recordAttendance(db, { lessonId: l.id, studentId: s.id, state: "present" }, admin);
    expect(await walletBalance(db, s.walletId)).toBe(1);
    const g = await createGroup(db, { name: "مجموعة المدرس", teacherId: t.id, studentIds: [s.id] }, admin);
    await closeTeacherMonth(db, t.id, "2026-09", admin);
    await createPortalAccount(db, { kind: "teacher", id: t.id, email: "teacher@test.local" }, admin);

    await deleteTeacher(db, t.id, admin);
    expect(await db.select().from(teachers).where(eq(teachers.id, t.id))).toEqual([]);
    expect(await db.select().from(lessons).where(eq(lessons.teacherId, t.id))).toEqual([]);
    expect(await db.select().from(groups).where(eq(groups.id, g.id))).toEqual([]);
    expect(await db.select().from(payouts).where(eq(payouts.teacherId, t.id))).toEqual([]);
    expect(await db.select().from(users).where(eq(users.email, "teacher@test.local"))).toEqual([]);
    expect(await db.select().from(students).where(eq(students.id, s.id))).toHaveLength(1);
    expect(await walletBalance(db, s.walletId)).toBe(2);
  });
});

describe("wipe all trial data", () => {
  it("needs the confirmation word", async () => {
    await expect(wipeTrialData(db, "yes", admin)).rejects.toBeInstanceOf(UserError);
  });

  it("empties everything but keeps staff, settings and prices", async () => {
    await db.update(settings).set({ academyName: "أمم" });
    await addPricePlan(db, { lessonsPerMonth: 8, minutes: 45, price: 80, currency: "USD", featured: false });
    const staff = await createUser(db, { name: "سكرتيرة", email: "staff@test.local", password: "password123", role: "staff" });
    const t = await createTeacher(db, { name: "مدرس", timezone: "Africa/Cairo", payPerLessonEgp: "100" }, admin);
    const s = await createStudent(db, { name: "Wipe Me", timezone: "Europe/Berlin" }, admin);
    await createPortalAccount(db, { kind: "student", id: s.id, email: "wipe@test.local" }, admin);
    await createPortalAccount(db, { kind: "teacher", id: t.id, email: "wipe-t@test.local" }, admin);
    await lesson(t.id, s.id, "2026-11-20");
    await createTrialRequest(db, visitor("Visitor", "v@test.local"));

    await wipeTrialData(db, ` ${WIPE_CONFIRM_WORD} `, admin);

    for (const tbl of [students, teachers, guardians, wallets, lessons, attendance, payments, creditEntries, groups, series, payouts, trialRequests])
      expect(await db.$count(tbl)).toBe(0);
    const left = await db.select({ id: users.id }).from(users);
    expect(left.map((u) => u.id).sort()).toEqual([admin, staff.id].sort());
    expect(await db.$count(users, inArray(users.role, ["teacher", "student", "guardian"]))).toBe(0);
    expect((await getSettings(db)).academyName).toBe("أمم");
    expect(await db.$count(pricePlans)).toBe(1);
    // new records start numbering from 1 again
    const fresh = await createStudent(db, { name: "Real", timezone: "Europe/Berlin" }, admin);
    expect(fresh.id).toBe(1);
  });
});
