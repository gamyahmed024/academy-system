"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { createPortalAccount, resetPortalPassword, setPortalActive, type PortalKind } from "@/server/services/portal";
import { run, str, type ActionState } from "@/server/action";

const PATHS: Record<PortalKind, string> = { teacher: "/teachers", student: "/students", guardian: "/families" };

async function siteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const loginText = async (email: string, password: string) =>
  `الرابط: ${await siteUrl()} · الإيميل: ${email} · كلمة السر: ${password} (ابعتهاله، وهو يقدر يغيرها من جوه)`;

export async function createAccountAction(kind: PortalKind, id: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(async () => {
    const acc = await createPortalAccount(getDb(), { kind, id, email: str(f, "email") }, u.id);
    return `اتعمل الحساب. ${await loginText(acc.email, acc.password)}`;
  });
  // No revalidation here: re-rendering would swap this form for the account
  // view and hide the one-time password before staff can copy it.
  return r;
}

export async function resetPasswordAction(kind: PortalKind, id: number, email: string): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(async () => {
    const password = await resetPortalPassword(getDb(), kind, id, u.id);
    return `كلمة سر جديدة. ${await loginText(email, password)}`;
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
