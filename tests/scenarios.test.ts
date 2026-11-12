/**
 * The simulation from the proposal (section 13), replayed against the real
 * services and a real Postgres database.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { testDb, resetDb, closeDb } from "./db";
import type { DB } from "@/db";
import { lessons, payouts } from "@/db/schema";
import {
  createGuardian,
  createStudent,
  createTeacher,
  createGroup,
  updateStudent,
  walletBalance,
  getStudent,
} from "@/server/services/people";
import { createSeries, createLesson, moveLesson, cancelLesson, listLessons, ConflictError } from "@/server/services/schedule";
import {
  recordAttendance,
  recordPayment,
  monthReport,
  closeTeacherMonth,
  lowBalanceStudents,
  updateSettings,
} from "@/server/services/money";
import { createUser, verifyLogin, startSession, userForToken, endSession } from "@/server/services/auth";
import { fmtTime } from "@/lib/domain/time";
import { UserError } from "@/server/services/errors";

let db: DB;
const ids: Record<string, number> = {};

beforeAll(async () => {
  db = await testDb();
  await resetDb(db);
  const admin = await createUser(db, { name: "عمر", email: "admin@test.local", password: "password123", role: "admin" });
  ids.admin = admin.id;
  ids.sara = (await createTeacher(db, { name: "أ. سارة", timezone: "Africa/Cairo", payPerLessonEgp: "250", meetingUrl: "https://meet.google.com/abc-defg-hij" }, admin.id)).id;
  ids.mahmoud = (await createTeacher(db, { name: "أ. محمود", timezone: "Africa/Cairo", payPerLessonEgp: "300" }, admin.id)).id;
  ids.emma = (await createStudent(db, { name: "Emma", timezone: "Europe/Berlin" }, admin.id)).id;
  ids.john = (await createStudent(db, { name: "John", timezone: "America/New_York" }, admin.id)).id;
  ids.smith = (await createGuardian(db, { name: "Mrs. Smith", timezone: "Europe/London" }, admin.id)).id;
  ids.liam = (await createStudent(db, { name: "Liam", timezone: "Europe/London", guardianId: ids.smith }, admin.id)).id;
  ids.noah = (await createStudent(db, { name: "Noah", timezone: "Europe/London", guardianId: ids.smith }, admin.id)).id;
  ids.sophie = (await createStudent(db, { name: "Sophie", timezone: "Europe/Paris" }, admin.id)).id;
  ids.lucas = (await createStudent(db, { name: "Lucas", timezone: "Europe/Madrid" }, admin.id)).id;
  ids.groupA = (await createGroup(db, { name: "مجموعة A", teacherId: ids.sara, studentIds: [ids.sophie, ids.lucas] }, admin.id)).id;
});

afterAll(async () => {
  await closeDb();
});

const range = { startDate: "2026-10-01", endDate: "2026-12-31" };

describe("schedule", () => {
  it("creates a series anchored to the student's timezone, stable across DST", async () => {
    const r = await createSeries(
      db,
      { teacherId: ids.sara, studentId: ids.emma, weekdays: [2, 4], localTime: "10:00", anchorTimezone: "Europe/Berlin", minutes: 60, ...range },
      ids.admin,
    );
    ids.emmaSeries = r.series.id;
    expect(r.count).toBe(27);
    const ls = await listLessons(db, { from: new Date("2026-10-01"), to: new Date("2027-01-01"), studentId: ids.emma });
    expect(new Set(ls.map((l) => fmtTime(l.startsAt, "Europe/Berlin")))).toEqual(new Set(["10:00"]));
  });

  it("rejects a series that collides with the teacher's existing lessons", async () => {
    await expect(
      createSeries(
        db,
        { teacherId: ids.sara, studentId: ids.john, weekdays: [2], localTime: "10:30", anchorTimezone: "Europe/Berlin", minutes: 60, ...range },
        ids.admin,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects a lesson that collides with the student's other lesson (different teacher)", async () => {
    await expect(
      createLesson(
        db,
        { teacherId: ids.mahmoud, studentId: ids.emma, date: "2026-10-06", time: "10:30", timezone: "Europe/Berlin", minutes: 30 },
        ids.admin,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("moves exactly one occurrence and leaves the rest of the series alone", async () => {
    const before = await listLessons(db, { from: new Date("2026-11-10T00:00:00Z"), to: new Date("2026-11-11T00:00:00Z"), studentId: ids.emma });
    expect(before).toHaveLength(1);
    await moveLesson(db, before[0].id, { date: "2026-11-11", time: "10:00", timezone: "Europe/Berlin", reason: "طلب الطالبة" }, ids.admin);
    const all = await listLessons(db, { from: new Date("2026-10-01"), to: new Date("2027-01-01"), studentId: ids.emma });
    expect(all).toHaveLength(27);
    const moved = all.find((l) => l.id === before[0].id)!;
    expect(moved.startsAt.toISOString()).toBe("2026-11-11T09:00:00.000Z");
    expect(moved.originalStartsAt?.toISOString()).toBe("2026-11-10T09:00:00.000Z");
    expect(all.filter((l) => l.originalStartsAt).length).toBe(1);
  });

  it("cancels one occurrence", async () => {
    const r = await createSeries(
      db,
      { teacherId: ids.mahmoud, studentId: ids.john, weekdays: [1, 3], localTime: "13:00", anchorTimezone: "America/New_York", minutes: 60, ...range },
      ids.admin,
    );
    ids.johnSeries = r.series.id;
    const [thanks] = await listLessons(db, { from: new Date("2026-11-25T00:00:00Z"), to: new Date("2026-11-26T00:00:00Z"), studentId: ids.john });
    await cancelLesson(db, thanks.id, "إجازة", ids.admin);
    const after = await listLessons(db, { from: new Date("2026-11-25T00:00:00Z"), to: new Date("2026-11-26T00:00:00Z"), studentId: ids.john });
    expect(after).toHaveLength(0);
  });

  it("group lessons show up for every member", async () => {
    await createSeries(
      db,
      { teacherId: ids.sara, groupId: ids.groupA, weekdays: [6], localTime: "19:00", anchorTimezone: "Africa/Cairo", minutes: 60, ...range },
      ids.admin,
    );
    const ls = await listLessons(db, { from: new Date("2026-10-01"), to: new Date("2026-11-01"), studentId: ids.lucas });
    expect(ls.length).toBe(5); // five Saturdays in October 2026
  });
});

describe("attendance, wallets and families", () => {
  it("applies the absence policy and keeps the ledger idempotent", async () => {
    await recordPayment(db, { studentId: ids.emma, amount: "120", currency: "EUR", rateToEgp: "56", lessonsCredited: 8, method: "PayPal", paidOn: "2026-10-01" }, ids.admin);
    const oct = await listLessons(db, { from: new Date("2026-10-01"), to: new Date("2026-11-01"), studentId: ids.emma });
    // 30h notice → free
    let r = await recordAttendance(db, { lessonId: oct[0].id, studentId: ids.emma, state: "excused", noticeAt: new Date(oct[0].startsAt.getTime() - 30 * 3600_000) }, ids.admin);
    expect(r.deducted).toBe(false);
    // 5h notice → deducted
    r = await recordAttendance(db, { lessonId: oct[1].id, studentId: ids.emma, state: "excused", noticeAt: new Date(oct[1].startsAt.getTime() - 5 * 3600_000) }, ids.admin);
    expect(r.deducted).toBe(true);
    // present, then corrected twice: still only one deduction
    await recordAttendance(db, { lessonId: oct[2].id, studentId: ids.emma, state: "present" }, ids.admin);
    await recordAttendance(db, { lessonId: oct[2].id, studentId: ids.emma, state: "absent" }, ids.admin);
    await recordAttendance(db, { lessonId: oct[2].id, studentId: ids.emma, state: "present" }, ids.admin);
    const s = await getStudent(db, ids.emma);
    expect(s!.balance).toBe(8 - 2);
  });

  it("teacher cancellation is not deducted and cancels the lesson", async () => {
    const before = (await getStudent(db, ids.emma))!.balance;
    const oct = await listLessons(db, { from: new Date("2026-10-01"), to: new Date("2026-11-01"), studentId: ids.emma });
    const target = oct[3];
    await recordAttendance(db, { lessonId: target.id, studentId: ids.emma, state: "teacher_cancelled" }, ids.admin);
    expect((await getStudent(db, ids.emma))!.balance).toBe(before);
    const [l] = await db.select().from(lessons).where(eq(lessons.id, target.id));
    expect(l.status).toBe("cancelled");
  });

  it("one guardian pays once for two children who share a wallet", async () => {
    await recordPayment(db, { guardianId: ids.smith, amount: "260", currency: "GBP", rateToEgp: "64", lessonsCredited: 16, method: "تحويل", paidOn: "2026-10-01" }, ids.admin);
    const liam = await createLesson(db, { teacherId: ids.mahmoud, studentId: ids.liam, date: "2026-10-04", time: "17:00", timezone: "Europe/London", minutes: 60 }, ids.admin);
    const noah = await createLesson(db, { teacherId: ids.mahmoud, studentId: ids.noah, date: "2026-10-04", time: "18:00", timezone: "Europe/London", minutes: 60 }, ids.admin);
    await recordAttendance(db, { lessonId: liam.id, studentId: ids.liam, state: "present" }, ids.admin);
    await recordAttendance(db, { lessonId: noah.id, studentId: ids.noah, state: "present" }, ids.admin);
    const l = await getStudent(db, ids.liam);
    const n = await getStudent(db, ids.noah);
    expect(l!.walletId).toBe(n!.walletId);
    expect(l!.balance).toBe(14);
    expect(n!.siblings.map((x) => x.name)).toEqual(["Liam"]);
  });

  it("moving a student into a family carries their remaining credits", async () => {
    await recordPayment(db, { studentId: ids.sophie, amount: "60", currency: "EUR", rateToEgp: "56", lessonsCredited: 4, method: "PayPal", paidOn: "2026-10-02" }, ids.admin);
    const famBefore = await getStudent(db, ids.liam);
    await updateStudent(db, ids.sophie, { name: "Sophie", timezone: "Europe/Paris", guardianId: ids.smith }, ids.admin);
    const famAfter = await walletBalance(db, famBefore!.walletId);
    expect(famAfter).toBe(famBefore!.balance + 4);
  });

  it("lists low-balance students, including negative balances", async () => {
    const low = await lowBalanceStudents(db);
    expect(low.find((s) => s.id === ids.john)?.balance).toBe(0);
  });
});

describe("money and reports", () => {
  it("keeps October's report fixed after rates change and after the month is closed", async () => {
    await recordPayment(db, { studentId: ids.john, amount: "180", currency: "USD", rateToEgp: "48.5", lessonsCredited: 8, method: "تحويل", paidOn: "2026-10-02" }, ids.admin);
    const oct1 = await monthReport(db, "2026-10");
    // November payments arrive at a higher rate; October must not move
    await recordPayment(db, { studentId: ids.emma, amount: "120", currency: "EUR", rateToEgp: "58.5", lessonsCredited: 8, method: "PayPal", paidOn: "2026-11-01" }, ids.admin);
    const oct2 = await monthReport(db, "2026-10");
    expect(oct2.revenueEgp).toBe(oct1.revenueEgp);
    // 120*56 + 260*64 + 60*56 + 180*48.5
    expect(oct1.revenueEgp).toBe("35450.00");
    expect(oct1.byCurrency).toEqual({ EUR: "180.00", GBP: "260.00", USD: "180.00" });
  });

  it("closing a teacher's month freezes the payout", async () => {
    const before = await monthReport(db, "2026-10");
    const sara = before.teachers.find((t) => t.teacherId === ids.sara)!;
    // Sara: 1 late-excuse + 1 present in October = 2 paid lessons
    expect(sara.lessons).toBe(2);
    expect(sara.amountEgp).toBe("500.00");
    await closeTeacherMonth(db, ids.sara, "2026-10", ids.admin);
    // a late correction after closing doesn't change the closed amount
    const oct = await listLessons(db, { from: new Date("2026-10-01"), to: new Date("2026-11-01"), studentId: ids.emma });
    await recordAttendance(db, { lessonId: oct[5].id, studentId: ids.emma, state: "present" }, ids.admin);
    const after = await monthReport(db, "2026-10");
    expect(after.teachers.find((t) => t.teacherId === ids.sara)!.amountEgp).toBe("500.00");
    expect(after.teachers.find((t) => t.teacherId === ids.sara)!.closed).toBe(true);
    await expect(closeTeacherMonth(db, ids.sara, "2026-10", ids.admin)).rejects.toBeInstanceOf(UserError);
    const rows = await db.select().from(payouts);
    expect(rows).toHaveLength(1);
  });

  it("no-show pay follows the setting", async () => {
    await updateSettings(db, { academyName: "الأكاديمية", freeCancelHours: 24, payTeacherOnNoShow: false, lowBalanceThreshold: 1 }, ids.admin);
    const nov = await listLessons(db, { from: new Date("2026-11-01"), to: new Date("2026-12-01"), studentId: ids.john });
    const r = await recordAttendance(db, { lessonId: nov[0].id, studentId: ids.john, state: "absent" }, ids.admin);
    expect(r).toEqual({ id: expect.any(Number), deducted: true, teacherPaid: false });
  });

  it("validates input with readable errors", async () => {
    await expect(
      recordPayment(db, { studentId: ids.john, amount: "-5", currency: "USD", rateToEgp: "50", lessonsCredited: 1, method: "x", paidOn: "2026-11-01" }, ids.admin),
    ).rejects.toThrow("المبلغ");
    await expect(
      createTeacher(db, { name: "x", timezone: "Africa/Cairo", payPerLessonEgp: "1", meetingUrl: "javascript:alert(1)" }, ids.admin),
    ).rejects.toThrow("https");
  });
});

describe("auth", () => {
  it("logs in, resolves the session, and logs out", async () => {
    expect(await verifyLogin(db, "admin@test.local", "wrong-password")).toBeNull();
    expect(await verifyLogin(db, "nobody@test.local", "password123")).toBeNull();
    const u = await verifyLogin(db, "ADMIN@test.local ", "password123");
    expect(u?.id).toBe(ids.admin);
    const { token } = await startSession(db, u!.id);
    const me = await userForToken(db, token);
    expect(me?.role).toBe("admin");
    expect(me && "passwordHash" in me).toBe(false);
    await endSession(db, token);
    expect(await userForToken(db, token)).toBeNull();
  });
});
