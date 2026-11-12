"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/server/session";
import { isLang, LANG_COOKIE } from "@/lib/i18n";

/** Switch language, remember it in a cookie and on the account, and stay on the page. */
export async function setLanguage(form: FormData) {
  const lang = form.get("lang");
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const u = await getCurrentUser();
  if (u) await getDb().update(users).set({ locale: lang }).where(eq(users.id, u.id));
  const back = (await headers()).get("referer");
  const path = back ? new URL(back).pathname + new URL(back).search : "/my";
  redirect(path.startsWith("/") ? path : "/my");
}
