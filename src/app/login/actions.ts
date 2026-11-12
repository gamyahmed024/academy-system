"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { verifyLogin, startSession, endSession } from "@/server/services/auth";
import { SESSION_COOKIE } from "@/server/session";
import { str, type ActionState } from "@/server/action";

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const db = getDb();
  const user = await verifyLogin(db, str(form, "email"), str(form, "password"));
  if (!user) return { error: "الإيميل أو كلمة السر غلط" };
  const { token, expiresAt } = await startSession(db, user.id);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await endSession(getDb(), token);
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
