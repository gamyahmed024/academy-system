"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requirePortal, requireRole } from "@/server/session";
import { excuseLesson, teacherRecordAttendance } from "@/server/services/portal";
import { changePassword, verifyLogin } from "@/server/services/auth";
import { run, str, type ActionState } from "@/server/action";
import { assert } from "@/server/services/errors";
import { getT } from "@/server/lang";
import { translateError } from "@/lib/i18n";
import type { AttendanceState } from "@/lib/domain/rules";

/** Show business errors in the visitor's language. */
async function localized(r: ActionState): Promise<ActionState> {
  if (!r?.error) return r;
  const { lang } = await getT();
  return { error: translateError(lang, r.error) };
}

export async function excuseAction(lessonId: number, studentId: number): Promise<ActionState> {
  const u = await requireRole("student", "guardian");
  const { t } = await getT();
  const r = await run(async () => {
    const d = await excuseLesson(getDb(), u, lessonId, studentId);
    return d.deducted ? t("excuseDoneLate") : t("excuseDoneFree");
  });
  revalidatePath("/my");
  return localized(r);
}

export async function teacherAttendanceAction(lessonId: number, studentId: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireRole("teacher");
  const { t } = await getT();
  const r = await run(async () => {
    await teacherRecordAttendance(getDb(), u, {
      lessonId,
      studentId,
      state: str(f, "state") as AttendanceState,
      note: str(f, "note") || null,
    });
    return t("recorded");
  });
  revalidatePath(`/my/lessons/${lessonId}`);
  return localized(r);
}

export async function changeMyPasswordAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requirePortal();
  const r = await run(async () => {
    const db = getDb();
    const ok = await verifyLogin(db, u.email, str(f, "current"));
    assert(ok, "كلمة السر الحالية غلط");
    assert(str(f, "next") === str(f, "confirm"), "كلمة السر الجديدة مش متطابقة");
    await changePassword(db, u.id, str(f, "next"));
  });
  if (r?.error) return localized(r);
  redirect("/login?changed=1");
}
