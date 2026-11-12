"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireAdmin, requireStaff } from "@/server/session";
import { updateSettings } from "@/server/services/money";
import { createUser, changePassword, verifyLogin } from "@/server/services/auth";
import { run, str, type ActionState } from "@/server/action";
import { assert } from "@/server/services/errors";

export async function settingsAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireAdmin();
  const r = await run(() =>
    updateSettings(
      getDb(),
      {
        academyName: str(f, "academyName"),
        freeCancelHours: Number(str(f, "freeCancelHours")),
        payTeacherOnNoShow: str(f, "payTeacherOnNoShow") === "1",
        lowBalanceThreshold: Number(str(f, "lowBalanceThreshold")),
        contactWhatsapp: String(f.get("contactWhatsapp") ?? ""),
      },
      u.id,
    ),
  );
  revalidatePath("/", "layout");
  return r;
}

export async function addStaffAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  return run(async () => {
    const role = str(f, "role") === "admin" ? "admin" : "staff";
    try {
      await createUser(getDb(), { name: str(f, "name"), email: str(f, "email"), password: str(f, "password"), role });
    } catch (e) {
      if (String((e as { cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code) === "23505") assert(false, "الإيميل ده مستخدم قبل كده");
      throw e;
    }
    revalidatePath("/settings");
    return "اتضاف المستخدم";
  });
}

export async function changePasswordAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  return run(async () => {
    const db = getDb();
    assert(await verifyLogin(db, u.email, str(f, "current")), "كلمة السر الحالية غلط");
    assert(str(f, "next") === str(f, "confirm"), "كلمة السر الجديدة مش متطابقة");
    await changePassword(db, u.id, str(f, "next"));
    return "اتغيرت كلمة السر، سجّل دخول تاني";
  });
}
