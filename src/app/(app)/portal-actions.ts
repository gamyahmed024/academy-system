"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { createPortalAccount, resetPortalPassword, setPortalActive, type PortalKind } from "@/server/services/portal";
import { run, str, type ActionState } from "@/server/action";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getSettings } from "@/server/services/money";
import { isLang, translator, type Lang } from "@/lib/i18n";
import { nameFor } from "@/lib/academy-name";

const PATHS: Record<PortalKind, string> = { teacher: "/teachers", student: "/students", guardian: "/families" };

async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** The ready-to-send message with the login details, in the person's own language. */
async function loginText(lang: Lang, name: string, email: string, password: string) {
  const s = await getSettings(getDb());
  const msg = translator(lang)("accountMessage", { name, academy: nameFor(s, lang), url: await siteUrl(), email, password });
  return `ابعتله الرسالة دي على الواتساب (كلمة السر بتظهر مرة واحدة بس):\n\n${msg}`;
}

export async function createAccountAction(kind: PortalKind, id: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(async () => {
    const lang = isLang(str(f, "lang")) ? (str(f, "lang") as Lang) : "en";
    const acc = await createPortalAccount(getDb(), { kind, id, email: str(f, "email") }, u.id);
    // The account opens in this language on any device until the person picks another.
    await getDb().update(users).set({ locale: lang }).where(eq(users.email, acc.email));
    return `اتعمل الحساب. ${await loginText(lang, acc.name, acc.email, acc.password)}`;
  });
  // No revalidation here: re-rendering would swap this form for the account
  // view and hide the one-time password before staff can copy it.
  return r;
}

export async function resetPasswordAction(kind: PortalKind, id: number, email: string): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(async () => {
    const password = await resetPortalPassword(getDb(), kind, id, u.id);
    const [acc] = await getDb().select({ name: users.name, locale: users.locale }).from(users).where(eq(users.email, email));
    const lang = isLang(acc?.locale) ? acc.locale : "en";
    return `كلمة سر جديدة. ${await loginText(lang, acc?.name ?? "", email, password)}`;
  });
  return r;
}

export async function toggleAccountAction(kind: PortalKind, id: number, active: boolean): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(async () => {
    await setPortalActive(getDb(), kind, id, active, u.id);
    return active ? "الحساب اتفعّل" : "الحساب اتوقف، ومش هيقدر يدخل";
  });
  revalidatePath(`${PATHS[kind]}/${id}`);
  return r;
}
