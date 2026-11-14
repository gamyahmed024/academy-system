"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireStaff, requireAdmin } from "@/server/session";
import { deleteGuardian } from "@/server/services/cleanup";
import { createGuardian, updateGuardian, type GuardianInput } from "@/server/services/people";
import { run, str, optStr, type ActionState } from "@/server/action";

const read = (f: FormData): GuardianInput => ({
  name: str(f, "name"),
  email: optStr(f, "email"),
  whatsapp: optStr(f, "whatsapp"),
  timezone: str(f, "timezone"),
  notes: optStr(f, "notes"),
});

export async function createGuardianAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  let id = 0;
  const r = await run(async () => {
    id = (await createGuardian(getDb(), read(f), u.id)).id;
  });
  if (r?.error) return r;
  redirect(`/families/${id}`);
}

export async function updateGuardianAction(id: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(() => updateGuardian(getDb(), id, read(f), u.id));
  revalidatePath(`/families/${id}`);
  return r;
}

export async function deleteGuardianAction(id: number, _: ActionState, f: FormData): Promise<ActionState> {
  void f;
  const u = await requireAdmin();
  const r = await run(async () => {
    await deleteGuardian(getDb(), id, u.id);
  });
  if (r?.error) return r;
  revalidatePath("/", "layout");
  redirect("/families?deleted=1");
}
