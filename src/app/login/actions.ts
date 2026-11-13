"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { verifyLogin, startSession, endSession } from "@/server/services/auth";
import { SESSION_COOKIE, homeFor } from "@/server/session";
import { str, type ActionState } from "@/server/action";
import { getLang } from "@/server/lang";
import { isLang, translateError, translator, LANG_COOKIE } from "@/lib/i18n";
import { createPasswordHelp } from "@/server/services/requests";

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const db = getDb();
  const user = await verifyLogin(db, str(form, "email"), str(form, "password"));
  if (!user) return { error: translateError(await getLang(), "الإيميل أو كلمة السر غلط") };
  const { token, expiresAt } = await startSession(db, user.id);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  // A language the person picked before (saved on the account) wins over the browser's.
  const jar = await cookies();
  if (!jar.has(LANG_COOKIE) && user.locale !== "ar" && isLang(user.locale)) {
    jar.set(LANG_COOKIE, user.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  redirect(homeFor(user.role));
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await endSession(getDb(), token);
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

/** Ask the academy for a new password; the answer is the same whether or not the email has an account. */
export async function forgotPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const lang = await getLang();
  const t = translator(lang);
  try {
    const problem = await createPasswordHelp(getDb(), str(form, "email"), lang);
    return problem ? { error: t("invalidEmail") } : { ok: t("forgotDone") };
  } catch (e) {
    console.error(e);
    return { error: t("unexpected") };
  }
}
