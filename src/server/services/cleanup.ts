import { and, eq, inArray, or, sql } from "drizzle-orm";
import type { DB } from "@/db";
import {
  users,
  sessions,
  students,
  guardians,
  teachers,
  wallets,
  groups,
  groupMembers,
  series,
  lessons,
  attendance,
  payments,
  creditEntries,
  payouts,
  trialRequests,
  passwordHelpRequests,
  auditLog,
} from "@/db/schema";
import { audit } from "./people";
import { assert } from "./errors";

/*
 * Deleting people for good. The data model keeps history (people get a status,
 * lessons get "cancelled"), and that is still the way for real people who
 * leave. These functions are for removing someone added by mistake or while
 * trying the system out: they remove the person and everything that hangs on
 * them, so nothing is left pointing at a missing row.
 */

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

/** The word the admin types to confirm wiping all the trial data. */
export const WIPE_CONFIRM_WORD = "امسح";

/** Remove attendance rows (and the credit they took) by id. */
async function dropAttendance(tx: Tx, ids: number[]) {
  if (!ids.length) return;
  await tx.delete(creditEntries).where(inArray(creditEntries.attendanceId, ids));
  await tx.delete(attendance).where(inArray(attendance.id, ids));
}

/** Remove lessons with all their attendance. */
async function dropLessons(tx: Tx, lessonIds: number[]) {
  if (!lessonIds.length) return;
  const att = await tx.select({ id: attendance.id }).from(attendance).where(inArray(attendance.lessonId, lessonIds));
  await dropAttendance(tx, att.map((a) => a.id));
  await tx.delete(lessons).where(inArray(lessons.id, lessonIds));
}

/** Remove payments with the credit they added. */
async function dropPayments(tx: Tx, paymentIds: number[]) {
  if (!paymentIds.length) return;
  await tx.delete(creditEntries).where(inArray(creditEntries.paymentId, paymentIds));
  await tx.delete(payments).where(inArray(payments.id, paymentIds));
}

/** Remove a wallet that nobody uses any more, with its whole ledger. */
async function dropWalletIfUnused(tx: Tx, walletId: number) {
  const [s] = await tx.select({ id: students.id }).from(students).where(eq(students.walletId, walletId)).limit(1);
  const [g] = await tx.select({ id: guardians.id }).from(guardians).where(eq(guardians.walletId, walletId)).limit(1);
  if (s || g) return;
  const pays = await tx.select({ id: payments.id }).from(payments).where(eq(payments.walletId, walletId));
  await dropPayments(tx, pays.map((p) => p.id));
  await tx.delete(creditEntries).where(eq(creditEntries.walletId, walletId));
  await tx.delete(wallets).where(eq(wallets.id, walletId));
}

/** Remove a portal login (teacher, student or guardian). Staff accounts are never touched here. */
async function dropPortalUser(tx: Tx, userId: number | null) {
  if (!userId) return;
  const [u] = await tx.select({ role: users.role }).from(users).where(eq(users.id, userId));
  if (!u || u.role === "admin" || u.role === "staff") return;
  await tx.delete(sessions).where(eq(sessions.userId, userId));
  await tx.delete(passwordHelpRequests).where(eq(passwordHelpRequests.userId, userId));
  await tx.update(attendance).set({ recordedBy: null }).where(eq(attendance.recordedBy, userId));
  await tx.update(payments).set({ createdBy: null }).where(eq(payments.createdBy, userId));
  await tx.update(auditLog).set({ userId: null }).where(eq(auditLog.userId, userId));
  await tx.delete(users).where(eq(users.id, userId));
}

async function deleteStudentTx(tx: Tx, id: number) {
  const [s] = await tx.select().from(students).where(eq(students.id, id));
  assert(s, "الطالب مش موجود");

  // the student's own lessons, then their seat in group lessons
  const own = await tx.select({ id: lessons.id }).from(lessons).where(eq(lessons.studentId, id));
  await dropLessons(tx, own.map((l) => l.id));
  await tx.delete(series).where(eq(series.studentId, id));
  const att = await tx.select({ id: attendance.id }).from(attendance).where(eq(attendance.studentId, id));
  await dropAttendance(tx, att.map((a) => a.id));
  await tx.delete(groupMembers).where(eq(groupMembers.studentId, id));

  // payments made for this student (in a family, the family keeps the rest)
  const pays = await tx.select({ id: payments.id }).from(payments).where(eq(payments.studentId, id));
  await dropPayments(tx, pays.map((p) => p.id));

  // the visitor request stays in the requests page, just without the link
  await tx.update(trialRequests).set({ studentId: null }).where(eq(trialRequests.studentId, id));

  await tx.delete(students).where(eq(students.id, id));
  await dropWalletIfUnused(tx, s.walletId);
  await dropPortalUser(tx, s.userId);
  return s;
}

/** Delete a student and everything of theirs: lessons, attendance, payments, login. */
export async function deleteStudent(db: DB, id: number, by: number | null) {
  return db.transaction(async (tx) => {
    const s = await deleteStudentTx(tx, id);
    await audit(tx, by, "delete", "student", id, { name: s.name });
    return s;
  });
}

/** Delete a family: its guardian, its children, the shared wallet and their logins. */
export async function deleteGuardian(db: DB, id: number, by: number | null) {
  return db.transaction(async (tx) => {
    const [g] = await tx.select().from(guardians).where(eq(guardians.id, id));
    assert(g, "العيلة مش موجودة");
    const kids = await tx.select({ id: students.id }).from(students).where(eq(students.guardianId, id));
    for (const k of kids) await deleteStudentTx(tx, k.id);
    const pays = await tx.select({ id: payments.id }).from(payments).where(eq(payments.guardianId, id));
    await dropPayments(tx, pays.map((p) => p.id));
    await tx.delete(guardians).where(eq(guardians.id, id));
    await dropWalletIfUnused(tx, g.walletId);
    await dropPortalUser(tx, g.userId);
    await audit(tx, by, "delete", "guardian", id, { name: g.name, children: kids.length });
    return g;
  });
}

/**
 * Delete a teacher with their lessons, groups and payouts. Students stay; any
 * credit their lessons with this teacher took is given back, since those
 * lessons no longer exist.
 */
export async function deleteTeacher(db: DB, id: number, by: number | null) {
  return db.transaction(async (tx) => {
    const [t] = await tx.select().from(teachers).where(eq(teachers.id, id));
    assert(t, "المدرس مش موجود");
    const gs = await tx.select({ id: groups.id }).from(groups).where(eq(groups.teacherId, id));
    const groupIds = gs.map((g) => g.id);
    const ls = await tx
      .select({ id: lessons.id })
      .from(lessons)
      .where(groupIds.length ? or(eq(lessons.teacherId, id), inArray(lessons.groupId, groupIds)) : eq(lessons.teacherId, id));
    await dropLessons(tx, ls.map((l) => l.id));
    await tx.delete(series).where(groupIds.length ? or(eq(series.teacherId, id), inArray(series.groupId, groupIds)) : eq(series.teacherId, id));
    if (groupIds.length) {
      await tx.delete(groupMembers).where(inArray(groupMembers.groupId, groupIds));
      await tx.delete(groups).where(inArray(groups.id, groupIds));
    }
    await tx.delete(payouts).where(eq(payouts.teacherId, id));
    await tx.delete(teachers).where(eq(teachers.id, id));
    await dropPortalUser(tx, t.userId);
    await audit(tx, by, "delete", "teacher", id, { name: t.name });
    return t;
  });
}

/** What a delete would remove, so the confirmation can say it plainly. */
export async function studentFootprint(db: DB, id: number) {
  const [l, a, p] = await Promise.all([
    db.$count(lessons, eq(lessons.studentId, id)),
    db.$count(attendance, eq(attendance.studentId, id)),
    db.$count(payments, eq(payments.studentId, id)),
  ]);
  return { lessons: l, attendance: a, payments: p };
}

export async function teacherFootprint(db: DB, id: number) {
  const [l, g] = await Promise.all([db.$count(lessons, eq(lessons.teacherId, id)), db.$count(groups, eq(groups.teacherId, id))]);
  return { lessons: l, groups: g };
}

/**
 * Start fresh: remove every student, family, teacher, lesson, payment and
 * visitor request, and every portal login. Admin and staff accounts, the
 * settings and the price packages stay.
 */
export async function wipeTrialData(db: DB, confirmWord: string, by: number | null) {
  assert(confirmWord.trim() === WIPE_CONFIRM_WORD, `اكتب كلمة «${WIPE_CONFIRM_WORD}» بالظبط علشان نأكد المسح`);
  return db.transaction(async (tx) => {
    const portal = await tx
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ["teacher", "student", "guardian"]));
    const portalIds = portal.map((u) => u.id);
    // No CASCADE: if a new table ever points at one of these, Postgres refuses
    // instead of quietly emptying something we did not list.
    await tx.execute(sql`
      TRUNCATE credit_entries, payments, payouts, attendance, lessons, series,
        group_members, groups, trial_requests, password_help_requests,
        students, guardians, teachers, wallets
      RESTART IDENTITY`);
    if (portalIds.length) {
      await tx.delete(sessions).where(inArray(sessions.userId, portalIds));
      await tx.update(auditLog).set({ userId: null }).where(inArray(auditLog.userId, portalIds));
      await tx.delete(users).where(and(inArray(users.id, portalIds), inArray(users.role, ["teacher", "student", "guardian"])));
    }
    await audit(tx, by, "wipe", "trial_data", null, { portalUsers: portalIds.length });
    return { portalUsers: portalIds.length };
  });
}
