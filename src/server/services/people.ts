import { and, eq, inArray, sql, desc, asc } from "drizzle-orm";
import type { DB } from "@/db";
import {
  students,
  guardians,
  teachers,
  wallets,
  creditEntries,
  groups,
  groupMembers,
  auditLog,
} from "@/db/schema";
import { isValidTimezone } from "@/lib/domain/time";
import { assert } from "./errors";

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type Conn = DB | Tx;

export async function audit(
  db: Conn,
  userId: number | null,
  action: string,
  entity: string,
  entityId: number | null,
  data?: unknown,
) {
  await db.insert(auditLog).values({ userId, action, entity, entityId, data: data as object });
}

/* ------------------------------ wallets ------------------------------ */

export async function walletBalance(db: Conn, walletId: number): Promise<number> {
  const [r] = await db
    .select({ b: sql<string>`coalesce(sum(${creditEntries.delta}), 0)` })
    .from(creditEntries)
    .where(eq(creditEntries.walletId, walletId));
  return Number(r.b);
}

export async function walletBalances(db: Conn, walletIds: number[]): Promise<Map<number, number>> {
  const m = new Map<number, number>();
  if (!walletIds.length) return m;
  const rows = await db
    .select({ w: creditEntries.walletId, b: sql<string>`sum(${creditEntries.delta})` })
    .from(creditEntries)
    .where(inArray(creditEntries.walletId, walletIds))
    .groupBy(creditEntries.walletId);
  for (const id of walletIds) m.set(id, 0);
  for (const r of rows) m.set(r.w, Number(r.b));
  return m;
}

/* ------------------------------ guardians ------------------------------ */

export type GuardianInput = {
  name: string;
  email?: string | null;
  whatsapp?: string | null;
  timezone: string;
  notes?: string | null;
};

export async function createGuardian(db: DB, input: GuardianInput, by: number | null) {
  assert(input.name.trim(), "اكتب اسم ولي الأمر");
  assert(isValidTimezone(input.timezone), "المنطقة الزمنية مش صحيحة");
  return db.transaction(async (tx) => {
    const [w] = await tx.insert(wallets).values({ label: `عائلة ${input.name.trim()}` }).returning();
    const [g] = await tx
      .insert(guardians)
      .values({ ...input, name: input.name.trim(), walletId: w.id })
      .returning();
    await audit(tx, by, "create", "guardian", g.id);
    return g;
  });
}

export async function updateGuardian(db: DB, id: number, input: GuardianInput, by: number | null) {
  assert(input.name.trim(), "اكتب اسم ولي الأمر");
  assert(isValidTimezone(input.timezone), "المنطقة الزمنية مش صحيحة");
  await db.update(guardians).set({ ...input, name: input.name.trim() }).where(eq(guardians.id, id));
  await audit(db, by, "update", "guardian", id);
}

/**
 * Move a student into (or out of) a family. Their remaining credits move with
 * them as two ledger entries, so history stays intact.
 */
async function moveStudentWallet(tx: Tx, studentId: number, fromWallet: number, toWallet: number) {
  if (fromWallet === toWallet) return;
  const bal = await walletBalance(tx, fromWallet);
  if (bal !== 0) {
    await tx.insert(creditEntries).values([
      { walletId: fromWallet, delta: -bal, reason: `transfer_out:student:${studentId}` },
      { walletId: toWallet, delta: bal, reason: `transfer_in:student:${studentId}` },
    ]);
  }
  await tx.update(students).set({ walletId: toWallet }).where(eq(students.id, studentId));
}

/* ------------------------------ students ------------------------------ */

export type StudentInput = {
  name: string;
  email?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  nativeLanguage?: string | null;
  timezone: string;
  subject?: string | null;
  level?: string | null;
  meetingUrl?: string | null;
  status?: "trial" | "active" | "paused" | "stopped";
  guardianId?: number | null;
  notes?: string | null;
};

export async function createStudent(db: DB, input: StudentInput, by: number | null) {
  assert(input.name.trim(), "اكتب اسم الطالب");
  checkMeetingUrl(input.meetingUrl);
  assert(isValidTimezone(input.timezone), "المنطقة الزمنية مش صحيحة");
  return db.transaction(async (tx) => {
    let walletId: number;
    if (input.guardianId) {
      const [g] = await tx.select().from(guardians).where(eq(guardians.id, input.guardianId));
      assert(g, "ولي الأمر مش موجود");
      walletId = g.walletId;
    } else {
      const [w] = await tx.insert(wallets).values({ label: input.name.trim() }).returning();
      walletId = w.id;
    }
    const [s] = await tx
      .insert(students)
      .values({ ...input, name: input.name.trim(), walletId, guardianId: input.guardianId ?? null })
      .returning();
    await audit(tx, by, "create", "student", s.id);
    return s;
  });
}

export async function updateStudent(db: DB, id: number, input: StudentInput, by: number | null) {
  assert(input.name.trim(), "اكتب اسم الطالب");
  checkMeetingUrl(input.meetingUrl);
  assert(isValidTimezone(input.timezone), "المنطقة الزمنية مش صحيحة");
  await db.transaction(async (tx) => {
    const [cur] = await tx.select().from(students).where(eq(students.id, id));
    assert(cur, "الطالب مش موجود");
    const newGuardian = input.guardianId ?? null;
    if (newGuardian !== cur.guardianId) {
      let target: number;
      if (newGuardian) {
        const [g] = await tx.select().from(guardians).where(eq(guardians.id, newGuardian));
        assert(g, "ولي الأمر مش موجود");
        target = g.walletId;
      } else {
        const [w] = await tx.insert(wallets).values({ label: input.name.trim() }).returning();
        target = w.id;
      }
      await moveStudentWallet(tx, id, cur.walletId, target);
    }
    await tx
      .update(students)
      .set({ ...input, name: input.name.trim(), guardianId: newGuardian })
      .where(eq(students.id, id));
    await audit(tx, by, "update", "student", id, { guardianChanged: newGuardian !== cur.guardianId });
  });
}

export async function listStudents(db: DB, opts: { q?: string; status?: string } = {}) {
  const rows = await db
    .select({
      s: students,
      guardianName: guardians.name,
    })
    .from(students)
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .orderBy(asc(students.name));
  const q = opts.q?.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (!q || r.s.name.toLowerCase().includes(q) || (r.s.email ?? "").toLowerCase().includes(q)) &&
      (!opts.status || r.s.status === opts.status),
  );
  const bal = await walletBalances(
    db,
    [...new Set(filtered.map((r) => r.s.walletId))],
  );
  return filtered.map((r) => ({ ...r.s, guardianName: r.guardianName, balance: bal.get(r.s.walletId) ?? 0 }));
}

export async function getStudent(db: DB, id: number) {
  const [row] = await db
    .select({ s: students, g: guardians })
    .from(students)
    .leftJoin(guardians, eq(guardians.id, students.guardianId))
    .where(eq(students.id, id));
  if (!row) return null;
  const balance = await walletBalance(db, row.s.walletId);
  const siblings = row.s.guardianId
    ? await db
        .select({ id: students.id, name: students.name })
        .from(students)
        .where(and(eq(students.guardianId, row.s.guardianId)))
    : [];
  return { ...row.s, guardian: row.g, balance, siblings: siblings.filter((x) => x.id !== id) };
}

export async function listGuardians(db: DB) {
  const gs = await db.select().from(guardians).orderBy(asc(guardians.name));
  const kids = gs.length
    ? await db
        .select({ id: students.id, name: students.name, guardianId: students.guardianId })
        .from(students)
        .where(inArray(students.guardianId, gs.map((g) => g.id)))
    : [];
  const bal = await walletBalances(db, gs.map((g) => g.walletId));
  return gs.map((g) => ({
    ...g,
    balance: bal.get(g.walletId) ?? 0,
    children: kids.filter((k) => k.guardianId === g.id),
  }));
}

export async function getGuardian(db: DB, id: number) {
  const [g] = await db.select().from(guardians).where(eq(guardians.id, id));
  if (!g) return null;
  const children = await db.select().from(students).where(eq(students.guardianId, id)).orderBy(asc(students.name));
  return { ...g, children, balance: await walletBalance(db, g.walletId) };
}

/* ------------------------------ teachers ------------------------------ */

export type TeacherInput = {
  name: string;
  email?: string | null;
  whatsapp?: string | null;
  timezone: string;
  subjects?: string | null;
  meetingUrl?: string | null;
  payPerLessonEgp: string;
  status?: "trial" | "active" | "paused" | "stopped";
};

function checkMeetingUrl(url?: string | null) {
  if (!url) return;
  let ok = false;
  try {
    const u = new URL(url);
    ok = u.protocol === "https:";
  } catch {}
  assert(ok, "رابط الحصة لازم يكون رابط كامل يبدأ بـ https://");
}

export async function createTeacher(db: DB, input: TeacherInput, by: number | null) {
  assert(input.name.trim(), "اكتب اسم المدرس");
  assert(isValidTimezone(input.timezone), "المنطقة الزمنية مش صحيحة");
  assert(/^\d+(\.\d{1,2})?$/.test(input.payPerLessonEgp), "أجر الحصة لازم يكون رقم");
  checkMeetingUrl(input.meetingUrl);
  const [t] = await db.insert(teachers).values({ ...input, name: input.name.trim() }).returning();
  await audit(db, by, "create", "teacher", t.id);
  return t;
}

export async function updateTeacher(db: DB, id: number, input: TeacherInput, by: number | null) {
  assert(input.name.trim(), "اكتب اسم المدرس");
  assert(isValidTimezone(input.timezone), "المنطقة الزمنية مش صحيحة");
  assert(/^\d+(\.\d{1,2})?$/.test(input.payPerLessonEgp), "أجر الحصة لازم يكون رقم");
  checkMeetingUrl(input.meetingUrl);
  await db.update(teachers).set({ ...input, name: input.name.trim() }).where(eq(teachers.id, id));
  await audit(db, by, "update", "teacher", id);
}

export async function listTeachers(db: DB) {
  return db.select().from(teachers).orderBy(asc(teachers.name));
}

export async function getTeacher(db: DB, id: number) {
  const [t] = await db.select().from(teachers).where(eq(teachers.id, id));
  return t ?? null;
}

/* ------------------------------ groups ------------------------------ */

export async function createGroup(
  db: DB,
  input: { name: string; teacherId: number; level?: string | null; studentIds: number[] },
  by: number | null,
) {
  assert(input.name.trim(), "اكتب اسم المجموعة");
  assert(input.studentIds.length > 0, "اختار طالب واحد على الأقل");
  return db.transaction(async (tx) => {
    const [g] = await tx
      .insert(groups)
      .values({ name: input.name.trim(), teacherId: input.teacherId, level: input.level ?? null })
      .returning();
    await tx.insert(groupMembers).values(input.studentIds.map((studentId) => ({ groupId: g.id, studentId })));
    await audit(tx, by, "create", "group", g.id);
    return g;
  });
}

export async function listGroups(db: DB) {
  const gs = await db
    .select({ g: groups, teacherName: teachers.name })
    .from(groups)
    .innerJoin(teachers, eq(teachers.id, groups.teacherId))
    .orderBy(desc(groups.active), asc(groups.name));
  const members = gs.length
    ? await db
        .select({ groupId: groupMembers.groupId, id: students.id, name: students.name })
        .from(groupMembers)
        .innerJoin(students, eq(students.id, groupMembers.studentId))
        .where(inArray(groupMembers.groupId, gs.map((x) => x.g.id)))
    : [];
  return gs.map((x) => ({ ...x.g, teacherName: x.teacherName, members: members.filter((m) => m.groupId === x.g.id) }));
}

export async function groupStudentIds(db: Conn, groupId: number): Promise<number[]> {
  const rows = await db.select({ id: groupMembers.studentId }).from(groupMembers).where(eq(groupMembers.groupId, groupId));
  return rows.map((r) => r.id);
}
