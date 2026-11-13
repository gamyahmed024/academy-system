import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { trialRequests, passwordHelpRequests, pricePlans, users, students, teachers, guardians } from "@/db/schema";
import { CURRENCIES } from "@/lib/domain/rules";
import { isValidTimezone } from "@/lib/domain/time";
import { assert } from "./errors";

export const LEVELS = ["none", "basic", "intermediate", "advanced"] as const;
export const FOR_WHOM = ["me", "child"] as const;
export const REQUEST_STATUSES = ["new", "contacted", "enrolled", "closed"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Why a visitor's request was refused; the page shows it in the visitor's language. */
export type RequestProblem = "name" | "email" | "whatsapp" | "choice" | "tooMany";

export type TrialRequestInput = {
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  timezone: string;
  level: string;
  forWhom: string;
  preferredTimes: string;
  message: string;
  lang: string;
};

/** Requests from one email in a day before we stop taking more. */
const DAILY_LIMIT = 3;

const clip = (s: string, n: number) => s.trim().slice(0, n);

/** Check a visitor's request; returns the first problem, or null when it can be saved. */
export function checkTrialRequest(i: TrialRequestInput): RequestProblem | null {
  if (i.name.trim().length < 2) return "name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email.trim())) return "email";
  if (i.whatsapp.trim() && i.whatsapp.replace(/\D/g, "").length < 8) return "whatsapp";
  if (!(LEVELS as readonly string[]).includes(i.level) || !(FOR_WHOM as readonly string[]).includes(i.forWhom)) return "choice";
  return null;
}

/** Save a visitor's request. Returns a problem instead of saving when the input is wrong or the email sent too many today. */
export async function createTrialRequest(db: DB, i: TrialRequestInput): Promise<RequestProblem | null> {
  const problem = checkTrialRequest(i);
  if (problem) return problem;
  const email = i.email.trim().toLowerCase();
  const [{ n }] = await db
    .select({ n: count() })
    .from(trialRequests)
    .where(and(eq(trialRequests.email, email), gte(trialRequests.createdAt, sql`now() - interval '1 day'`)));
  if (n >= DAILY_LIMIT) return "tooMany";
  await db.insert(trialRequests).values({
    name: clip(i.name, 120),
    email: clip(email, 200),
    whatsapp: clip(i.whatsapp, 40) || null,
    country: clip(i.country, 80) || null,
    timezone: isValidTimezone(i.timezone) ? i.timezone : null,
    level: i.level,
    forWhom: i.forWhom,
    preferredTimes: clip(i.preferredTimes, 300) || null,
    message: clip(i.message, 1000) || null,
    lang: clip(i.lang, 5),
  });
  return null;
}

export async function listTrialRequests(db: DB, status?: string) {
  const where = (REQUEST_STATUSES as readonly string[]).includes(status ?? "") ? eq(trialRequests.status, status as RequestStatus) : undefined;
  return db.select().from(trialRequests).where(where).orderBy(desc(trialRequests.createdAt)).limit(300);
}

/** New trial requests plus open password requests: the number shown in the sidebar. */
export async function countNewRequests(db: DB) {
  const [[a], [b]] = await Promise.all([
    db.select({ n: count() }).from(trialRequests).where(eq(trialRequests.status, "new")),
    db.select({ n: count() }).from(passwordHelpRequests).where(eq(passwordHelpRequests.handled, false)),
  ]);
  return a.n + b.n;
}

export async function updateTrialRequest(db: DB, id: number, status: string, staffNote: string) {
  assert((REQUEST_STATUSES as readonly string[]).includes(status), "اختار حالة صحيحة");
  const done = await db
    .update(trialRequests)
    .set({ status: status as RequestStatus, staffNote: staffNote.trim() || null })
    .where(eq(trialRequests.id, id))
    .returning({ id: trialRequests.id });
  assert(done.length === 1, "الطلب ده مش موجود");
}

/* ---------- "Forgot password" ---------- */

/**
 * Record that someone asked for a new password. The answer to the visitor never says
 * whether the email has an account, so the form cannot be used to find out who studies here.
 */
export async function createPasswordHelp(db: DB, email: string, lang: string): Promise<"email" | null> {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "email";
  const [{ n }] = await db
    .select({ n: count() })
    .from(passwordHelpRequests)
    .where(and(eq(passwordHelpRequests.email, e), gte(passwordHelpRequests.createdAt, sql`now() - interval '1 day'`)));
  if (n >= DAILY_LIMIT) return null;
  const [u] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${e}`);
  await db.insert(passwordHelpRequests).values({ email: e.slice(0, 200), userId: u?.id ?? null, lang: lang.slice(0, 5) });
  return null;
}

/** Open password requests, with the person's page when the email belongs to an account. */
export async function listPasswordHelp(db: DB) {
  const rows = await db
    .select({
      id: passwordHelpRequests.id,
      email: passwordHelpRequests.email,
      lang: passwordHelpRequests.lang,
      createdAt: passwordHelpRequests.createdAt,
      userName: users.name,
      role: users.role,
      studentId: students.id,
      teacherId: teachers.id,
      guardianId: guardians.id,
    })
    .from(passwordHelpRequests)
    .leftJoin(users, eq(users.id, passwordHelpRequests.userId))
    .leftJoin(students, eq(students.userId, users.id))
    .leftJoin(teachers, eq(teachers.userId, users.id))
    .leftJoin(guardians, eq(guardians.userId, users.id))
    .where(eq(passwordHelpRequests.handled, false))
    .orderBy(desc(passwordHelpRequests.createdAt));
  return rows.map((r) => ({
    ...r,
    page: r.studentId ? `/students/${r.studentId}` : r.teacherId ? `/teachers/${r.teacherId}` : r.guardianId ? `/families/${r.guardianId}` : null,
  }));
}

export async function markPasswordHelpHandled(db: DB, id: number) {
  await db.update(passwordHelpRequests).set({ handled: true }).where(eq(passwordHelpRequests.id, id));
}

/* ---------- Prices shown to visitors ---------- */

export async function listPricePlans(db: DB) {
  return db.select().from(pricePlans).where(eq(pricePlans.active, true)).orderBy(asc(pricePlans.lessonsPerMonth), asc(pricePlans.id));
}

export async function addPricePlan(db: DB, i: { lessonsPerMonth: number; minutes: number; price: number; currency: string; featured: boolean }) {
  assert(Number.isInteger(i.lessonsPerMonth) && i.lessonsPerMonth >= 1 && i.lessonsPerMonth <= 60, "عدد الحصص في الشهر لازم يكون من 1 لـ 60");
  assert(Number.isInteger(i.minutes) && i.minutes >= 15 && i.minutes <= 240, "مدة الحصة لازم تكون من 15 لـ 240 دقيقة");
  assert(Number.isFinite(i.price) && i.price > 0, "اكتب السعر");
  assert((CURRENCIES as readonly string[]).includes(i.currency), "اختار العملة");
  await db.insert(pricePlans).values({ ...i, price: i.price.toFixed(2) });
}

export async function removePricePlan(db: DB, id: number) {
  await db.update(pricePlans).set({ active: false }).where(eq(pricePlans.id, id));
}
