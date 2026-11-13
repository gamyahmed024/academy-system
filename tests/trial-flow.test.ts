/**
 * The trial journey found in the end-to-end simulation: a visitor's request becomes a student,
 * the free 30-minute trial lesson costs no credit, and the first payment makes the student active.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DateTime } from "luxon";
import { eq, sql } from "drizzle-orm";
import { testDb, resetDb, closeDb } from "./db";
import type { DB } from "@/db";
import { students, trialRequests } from "@/db/schema";
import { createStudent, createTeacher, walletBalance } from "@/server/services/people";
import { createLesson } from "@/server/services/schedule";
import { recordAttendance, recordPayment, teacherMonthPay, getSettings, updateSettings } from "@/server/services/money";
import { monthKey } from "@/lib/domain/time";
import { createUser } from "@/server/services/auth";
import { createTrialRequest, listTrialRequests, linkRequestToStudent, requestLangOf } from "@/server/services/requests";

let db: DB;
const at = (hours: number) => {
  const d = DateTime.now().setZone("Europe/Berlin").plus({ hours }).startOf("minute");
  return { date: d.toISODate()!, time: d.toFormat("HH:mm"), timezone: "Europe/Berlin" };
};

beforeAll(async () => {
  db = await testDb();
  await resetDb(db);
  await db.execute(sql`TRUNCATE trial_requests RESTART IDENTITY CASCADE`);
});
afterAll(closeDb);

describe("trial journey", () => {
  it("goes from request to paying student without losing a credit", async () => {
    const admin = (await createUser(db, { name: "Admin", email: "a@test.local", password: "password123", role: "admin" })).id;
    await createTrialRequest(db, { name: "Lena", email: "lena@test.local", whatsapp: "", country: "DE", timezone: "Europe/Berlin", level: "none", forWhom: "me", preferredTimes: "", message: "", lang: "de" });
    const [req] = await listTrialRequests(db, "new");

    const lena = await createStudent(db, { name: "Lena", timezone: "Europe/Berlin", status: "trial" }, admin);
    await linkRequestToStudent(db, req.id, lena.id);
    const [linked] = await db.select().from(trialRequests).where(eq(trialRequests.id, req.id));
    expect(linked.studentId).toBe(lena.id);
    expect(linked.status).toBe("contacted");
    expect(await requestLangOf(db, lena.id)).toBe("de");

    const teacher = await createTeacher(db, { name: "T", timezone: "Africa/Cairo", payPerLessonEgp: "150", meetingUrl: "https://meet.google.com/x" }, admin);
    const trial = await createLesson(db, { teacherId: teacher.id, studentId: lena.id, minutes: 30, free: true, ...at(-2) }, admin);
    const att = await recordAttendance(db, { lessonId: trial.id, studentId: lena.id, state: "present" }, admin);
    expect(att.deducted).toBe(false);
    expect(att.teacherPaid).toBe(true);
    expect(await walletBalance(db, lena.walletId)).toBe(0);

    await recordPayment(db, { studentId: lena.id, amount: "80", currency: "EUR", rateToEgp: "52", lessonsCredited: 8, paidOn: "2026-11-13", method: "bank" }, admin);
    expect(await walletBalance(db, lena.walletId)).toBe(8);
    const [after] = await db.select().from(students).where(eq(students.id, lena.id));
    expect(after.status).toBe("active");

    // an ordinary lesson still takes a credit
    const paid = await createLesson(db, { teacherId: teacher.id, studentId: lena.id, minutes: 45, ...at(-5) }, admin);
    await recordAttendance(db, { lessonId: paid.id, studentId: lena.id, state: "present" }, admin);
    expect(await walletBalance(db, lena.walletId)).toBe(7);

    // the teacher gets the special trial rate (default 30 EGP) for the trial and the usual rate otherwise
    let s = await getSettings(db);
    expect(s.trialPayEgp).toBe("30.00");
    const month = monthKey(new Date(Date.now() - 5 * 3_600_000), s.academyTimezone);
    let pay = await teacherMonthPay(db, teacher, month, s);
    expect(pay).toEqual({ lessons: 2, trialLessons: 1, amountEgp: "180.00" });
    await updateSettings(db, { academyName: s.academyName, freeCancelHours: s.freeCancelHours, payTeacherOnNoShow: s.payTeacherOnNoShow, lowBalanceThreshold: s.lowBalanceThreshold, trialPayEgp: "50" }, admin);
    s = await getSettings(db);
    pay = await teacherMonthPay(db, teacher, month, s);
    expect(pay.amountEgp).toBe("200.00");
  });
});
