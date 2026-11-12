import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { userForToken, type Role } from "./services/auth";

export const SESSION_COOKIE = "academy_session";

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return userForToken(getDb(), token);
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Use at the top of every page and server action. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  if (!roles.includes(u.role)) redirect(isStaff(u.role) ? "/?denied=1" : "/my");
  return u;
}

export const isStaff = (r: Role) => r === "admin" || r === "staff";
/** Where each role lands after login. */
export const homeFor = (r: Role) => (isStaff(r) ? "/" : "/my");
export const requirePortal = () => requireRole("teacher", "student", "guardian");

export const requireStaff = () => requireRole("admin", "staff");
export const requireAdmin = () => requireRole("admin");
