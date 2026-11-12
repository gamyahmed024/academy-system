import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, and, gt, lt } from "drizzle-orm";
import type { DB } from "@/db";
import { users, sessions } from "@/db/schema";
import { assert } from "./errors";

export type Role = "admin" | "staff" | "teacher" | "student" | "guardian";
export const SESSION_DAYS = 30;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function createUser(
  db: DB,
  input: { name: string; email: string; password: string; role: Role; timezone?: string },
) {
  assert(input.password.length >= 8, "كلمة السر لازم تكون 8 حروف على الأقل");
  const email = input.email.trim().toLowerCase();
  assert(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), "الإيميل مش صحيح");
  const passwordHash = await bcrypt.hash(input.password, 10);
  const [u] = await db
    .insert(users)
    .values({ name: input.name, email, passwordHash, role: input.role, timezone: input.timezone ?? "Africa/Cairo" })
    .returning();
  return u;
}

export async function verifyLogin(db: DB, email: string, password: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
  // compare against a dummy hash too, so timing doesn't reveal which emails exist
  const ok = await bcrypt.compare(password, u?.passwordHash ?? DUMMY_HASH);
  if (!u || !ok || !u.active) return null;
  return u;
}

export async function startSession(db: DB, userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  // opportunistic cleanup
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  return { token, expiresAt };
}

export async function userForToken(db: DB, token: string) {
  const [r] = await db
    .select({ u: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())));
  if (!r || !r.u.active) return null;
  const { passwordHash: _omit, ...safe } = r.u;
  void _omit;
  return safe;
}

export async function endSession(db: DB, token: string) {
  await db.delete(sessions).where(eq(sessions.id, sha256(token)));
}

export async function changePassword(db: DB, userId: number, password: string) {
  assert(password.length >= 8, "كلمة السر لازم تكون 8 حروف على الأقل");
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 10) }).where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
