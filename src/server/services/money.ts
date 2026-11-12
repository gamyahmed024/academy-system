import { and, eq, gte, lt, sql, desc, inArray } from "drizzle-orm";
import type { DB } from "@/db";
import {
  attendance,
  creditEntries,
  lessons,
  payments,
  payouts,
  settings,
  students,
  guardians,
  teachers,
  wallets,
} from "@/db/schema";
import { decideAttendance, convertToEgp, sumMoney, mulMoney, subMoney, type AttendanceState } from "@/lib/domain/rules";
import { monthBounds } from "@/lib/domain/time";
import { assert } from "./errors";
import { audit, groupStudentIds } from "./people";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type Conn = DB | Tx;

export async function getSettings(db: Conn) {
  const [s] = await db.select().from(settings).where(eq(settings.id, 1));
  if (s) return s;
  const [created] = await db.insert(settings).values({ id: 1 }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(settings).where(eq(settings.id, 1)))[0];
}

export async function updateSettings(
  db: DB,
  input: { academyName: string; freeCancelHours: number; payTeacherOnNoShow: boolean; lowBalanceThreshold: number },
  by: number | null,
) {
  assert(input.academyName.trim(), "اكتب اسم الأكاديمية");
  assert(input.freeCancelHours >= 0 && input.freeCancelHours <= 168, "عدد الساعات مش منطقي");
  await getSettings(db);
  await db.update(settings).set({ ...input, academyName: input.academyName.trim() }).where(eq(settings.id, 1));
  await audit(db, by, "update", "settings", 1, input);
}

/* ------------------------------ attendance ------------------------------ */

/**
 * Record (or re-record) one student's attendance for a lesson. Idempotent:
 * the ledger entry tied to this attendance row is replaced, never duplicated.
 */
export async function recordAttendance(
  db: DB,
  input: { lessonId: number; studentId: number; state: AttendanceState; noticeAt?: Date | null; note?: string | null },
  by: number | null,
) {
  return db.transaction(async (tx) => {
    const [l] = await tx.select().from(lessons).where(eq(lessons.id, input.lessonId)).for("update");
    assert(l, "الحصة مش موجودة");
    assert(l.status !== "cancelled" || input.state === "teacher_cancelled", "الحصة دي اتلغت");
    const members = l.studentId ? [l.studentId] : await groupStudentIds(tx, l.groupId!);
    assert(members.includes(input.studentId), "الطالب ده مش في الحصة دي");
    if (input.state === "excused") assert(input.noticeAt, "اكتب امتى الطالب اعتذر");
    assert(
      input.state === "excused" || input.state === "teacher_cancelled" || l.startsAt.getTime() <= Date.now(),
      "الحصة لسه مبدأتش. قبل الحصة تقدر تسجل اعتذار أو إلغاء من المدرس بس",
    );

    const policy = await getSettings(tx);
    const d = decideAttendance(input.state, l.startsAt, input.noticeAt ?? null, policy);
    const [student] = await tx.select().from(students).where(eq(students.id, input.studentId));

    const [existing] = await tx
      .select()
      .from(attendance)
      .where(and(eq(attendance.lessonId, l.id), eq(attendance.studentId, input.studentId)));
    let attId: number;
    const values = {
      state: input.state,
      noticeAt: input.noticeAt ?? null,
      deducted: d.deducted,
      teacherPaid: d.teacherPaid,
      note: input.note ?? null,
      recordedBy: by,
      recordedAt: new Date(),
    };
    if (existing) {
      await tx.update(attendance).set(values).where(eq(attendance.id, existing.id));
      await tx.delete(creditEntries).where(eq(creditEntries.attendanceId, existing.id));
      attId = existing.id;
    } else {
      const [a] = await tx
        .insert(attendance)
        .values({ lessonId: l.id, studentId: input.studentId, ...values })
        .returning();
      attId = a.id;
    }
    if (d.deducted) {
      await tx
        .insert(creditEntries)
        .values({ walletId: student.walletId, delta: -1, reason: `lesson:${input.state}`, attendanceId: attId });
    }

    // lesson status follows the recorded attendance
    const all = await tx.select().from(attendance).where(eq(attendance.lessonId, l.id));
    const allTeacherCancelled = all.length === members.length && all.every((a) => a.state === "teacher_cancelled");
    const status = allTeacherCancelled ? "cancelled" : all.length ? "done" : "scheduled";
    await tx
      .update(lessons)
      .set({ status, cancelReason: allTeacherCancelled ? "المدرس لغى الحصة" : l.cancelReason })
      .where(eq(lessons.id, l.id));
    await audit(tx, by, existing ? "update" : "create", "attendance", attId, { ...input, ...d });
    return { id: attId, ...d };
  });
}

/* ------------------------------ payments ------------------------------ */

export async function recordPayment(
  db: DB,
  input: {
    studentId?: number | null;
    guardianId?: number | null;
    amount: string;
    currency: string;
    rateToEgp: string;
    lessonsCredited: number;
    method: string;
    paidOn: string;
    note?: string | null;
  },
  by: number | null,
) {
  assert(!!input.studentId !== !!input.guardianId, "اختار الطالب أو ولي الأمر اللي دفع");
  assert(/^\d+(\.\d{1,2})?$/.test(input.amount) && Number(input.amount) > 0, "المبلغ لازم يكون رقم أكبر من صفر");
  assert(/^\d+(\.\d{1,6})?$/.test(input.rateToEgp) && Number(input.rateToEgp) > 0, "سعر الصرف لازم يكون رقم أكبر من صفر");
  assert(input.currency !== "EGP" || Number(input.rateToEgp) === 1, "سعر صرف الجنيه لازم يكون 1");
  assert(Number.isInteger(input.lessonsCredited) && input.lessonsCredited >= 0, "عدد الحصص لازم يكون رقم صحيح");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn), "تاريخ الدفع مش صحيح");
  assert(input.method.trim(), "اختار طريقة الدفع");

  return db.transaction(async (tx) => {
    let walletId: number;
    if (input.studentId) {
      const [s] = await tx.select().from(students).where(eq(students.id, input.studentId));
      assert(s, "الطالب مش موجود");
      walletId = s.walletId;
    } else {
      const [g] = await tx.select().from(guardians).where(eq(guardians.id, input.guardianId!));
      assert(g, "ولي الأمر مش موجود");
      walletId = g.walletId;
    }
    const amountEgp = convertToEgp(input.amount, input.rateToEgp);
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(payments);
    const receiptNo = `R-${input.paidOn.slice(0, 4)}-${String(n + 1).padStart(5, "0")}`;
    const [p] = await tx
      .insert(payments)
      .values({
        walletId,
        studentId: input.studentId ?? null,
        guardianId: input.guardianId ?? null,
        amount: input.amount,
        currency: input.currency,
        rateToEgp: input.rateToEgp,
        amountEgp,
        lessonsCredited: input.lessonsCredited,
        method: input.method.trim(),
        paidOn: input.paidOn,
        receiptNo,
        note: input.note ?? null,
        createdBy: by,
      })
      .returning();
    if (input.lessonsCredited > 0) {
      await tx.insert(creditEntries).values({ walletId, delta: input.lessonsCredited, reason: "payment", paymentId: p.id });
    }
    await audit(tx, by, "create", "payment", p.id, { amount: input.amount, currency: input.currency, amountEgp });
    return p;
  });
}

export async function listPayments(db: DB, opts: { month?: string; walletId?: number; timezone?: string } = {}) {
  const conds = [];
  if (opts.month) {
    conds.push(gte(payments.paidOn, `${opts.month}-01`));
    const { end } = monthBounds(opts.month, "UTC");
    conds.push(lt(payments.paidOn, end.toISOString().slice(0, 10)));
  }
  if (opts.walletId) conds.push(eq(payments.walletId, opts.walletId));
  return db
    .select({
      p: payments,
      studentName: students.name,
      guardianName: guardians.name,
      walletLabel: wallets.label,
    })
    .from(payments)
    .leftJoin(students, eq(students.id, payments.studentId))
    .leftJoin(guardians, eq(guardians.id, payments.guardianId))
    .innerJoin(wallets, eq(wallets.id, payments.walletId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(payments.paidOn), desc(payments.id))
    .then((rows) => rows.map((r) => ({ ...r.p, payer: r.studentName ?? r.guardianName ?? r.walletLabel })));
}

export async function getPayment(db: DB, id: number) {
  const [r] = await db
    .select({ p: payments, studentName: students.name, guardianName: guardians.name })
    .from(payments)
    .leftJoin(students, eq(students.id, payments.studentId))
    .leftJoin(guardians, eq(guardians.id, payments.guardianId))
    .where(eq(payments.id, id));
  return r ? { ...r.p, payer: r.studentName ?? r.guardianName ?? "" } : null;
}

/* ------------------------------ reports ------------------------------ */

/** Lessons a teacher is owed for in a month (group lessons count once). */
export async function teacherMonthLessons(db: Conn, teacherId: number, month: string, tz: string): Promise<number> {
  const { start, end } = monthBounds(month, tz);
  const [r] = await db
    .select({ n: sql<number>`count(distinct ${lessons.id})::int` })
    .from(lessons)
    .innerJoin(attendance, eq(attendance.lessonId, lessons.id))
    .where(
      and(
        eq(lessons.teacherId, teacherId),
        eq(attendance.teacherPaid, true),
        gte(lessons.startsAt, start),
        lt(lessons.startsAt, end),
      ),
    );
  return r.n;
}

/** Close a teacher's month: freezes the amount so later changes cannot alter it. */
export async function closeTeacherMonth(db: DB, teacherId: number, month: string, by: number | null) {
  return db.transaction(async (tx) => {
    const s = await getSettings(tx);
    const [t] = await tx.select().from(teachers).where(eq(teachers.id, teacherId));
    assert(t, "المدرس مش موجود");
    const [already] = await tx
      .select()
      .from(payouts)
      .where(and(eq(payouts.teacherId, teacherId), eq(payouts.month, month)));
    assert(!already, "الشهر ده اتقفل للمدرس ده قبل كده");
    const n = await teacherMonthLessons(tx, teacherId, month, s.academyTimezone);
    const [p] = await tx
      .insert(payouts)
      .values({ teacherId, month, lessons: n, amountEgp: mulMoney(t.payPerLessonEgp, n) })
      .returning();
    await audit(tx, by, "close", "payout", p.id, { month, lessons: n });
    return p;
  });
}

export async function markPayoutPaid(db: DB, payoutId: number, paidOn: string, by: number | null) {
  await db.update(payouts).set({ paidOn }).where(eq(payouts.id, payoutId));
  await audit(db, by, "paid", "payout", payoutId, { paidOn });
}

export async function monthReport(db: DB, month: string) {
  const s = await getSettings(db);
  const { end } = monthBounds(month, "UTC");
  const pays = await db
    .select({ amountEgp: payments.amountEgp, currency: payments.currency, amount: payments.amount })
    .from(payments)
    .where(and(gte(payments.paidOn, `${month}-01`), lt(payments.paidOn, end.toISOString().slice(0, 10))));
  const revenueEgp = sumMoney(pays.map((p) => p.amountEgp));
  const byCurrency: Record<string, string> = {};
  for (const p of pays) byCurrency[p.currency] = sumMoney([byCurrency[p.currency] ?? "0", p.amount]);

  const ts = await db.select().from(teachers);
  const closed = await db.select().from(payouts).where(eq(payouts.month, month));
  const teacherRows = [];
  for (const t of ts) {
    const c = closed.find((p) => p.teacherId === t.id);
    if (c) {
      teacherRows.push({ teacherId: t.id, name: t.name, lessons: c.lessons, amountEgp: c.amountEgp, closed: true, payoutId: c.id, paidOn: c.paidOn });
    } else {
      const n = await teacherMonthLessons(db, t.id, month, s.academyTimezone);
      if (n === 0 && t.status === "stopped") continue;
      teacherRows.push({ teacherId: t.id, name: t.name, lessons: n, amountEgp: mulMoney(t.payPerLessonEgp, n), closed: false, payoutId: null, paidOn: null });
    }
  }
  const teachersEgp = sumMoney(teacherRows.map((r) => r.amountEgp));
  return {
    month,
    payments: pays.length,
    revenueEgp,
    byCurrency,
    teachers: teacherRows,
    teachersEgp,
    netEgp: subMoney(revenueEgp, teachersEgp),
  };
}

/** Students whose (possibly shared) wallet is at or below the threshold. */
export async function lowBalanceStudents(db: DB) {
  const s = await getSettings(db);
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      walletId: students.walletId,
      status: students.status,
      guardianName: guardians.name,
    })
    .from(students)
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .where(inArray(students.status, ["active", "trial"]));
  if (!rows.length) return [];
  const bal = await db
    .select({ w: creditEntries.walletId, b: sql<string>`sum(${creditEntries.delta})` })
    .from(creditEntries)
    .where(inArray(creditEntries.walletId, [...new Set(rows.map((r) => r.walletId))]))
    .groupBy(creditEntries.walletId);
  const m = new Map(bal.map((b) => [b.w, Number(b.b)]));
  return rows
    .map((r) => ({ ...r, balance: m.get(r.walletId) ?? 0 }))
    .filter((r) => r.balance <= s.lowBalanceThreshold)
    .sort((a, b) => a.balance - b.balance);
}

export async function walletHistory(db: DB, walletId: number) {
  return db
    .select({
      e: creditEntries,
      lessonStartsAt: lessons.startsAt,
      studentName: students.name,
      state: attendance.state,
      receiptNo: payments.receiptNo,
    })
    .from(creditEntries)
    .leftJoin(attendance, eq(attendance.id, creditEntries.attendanceId))
    .leftJoin(lessons, eq(lessons.id, attendance.lessonId))
    .leftJoin(students, eq(students.id, attendance.studentId))
    .leftJoin(payments, eq(payments.id, creditEntries.paymentId))
    .where(eq(creditEntries.walletId, walletId))
    .orderBy(desc(creditEntries.createdAt), desc(creditEntries.id));
}

export async function studentAttendance(db: DB, studentId: number, limit = 30) {
  return db
    .select({ a: attendance, startsAt: lessons.startsAt, teacherName: teachers.name, lessonId: lessons.id })
    .from(attendance)
    .innerJoin(lessons, eq(lessons.id, attendance.lessonId))
    .innerJoin(teachers, eq(teachers.id, lessons.teacherId))
    .where(eq(attendance.studentId, studentId))
    .orderBy(desc(lessons.startsAt))
    .limit(limit);
}
