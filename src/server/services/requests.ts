import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import type { DB } from "@/db";
import { trialRequests } from "@/db/schema";
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

export async function countNewRequests(db: DB) {
  const [{ n }] = await db.select({ n: count() }).from(trialRequests).where(eq(trialRequests.status, "new"));
  return n;
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
