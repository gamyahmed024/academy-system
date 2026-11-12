"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireStaff, requireAdmin } from "@/server/session";
import { createTeacher, updateTeacher, type TeacherInput } from "@/server/services/people";
import { closeTeacherMonth, markPayoutPaid } from "@/server/services/money";
import { run, str, optStr, type ActionState } from "@/server/action";
import { assert } from "@/server/services/errors";

const read = (f: FormData): TeacherInput => ({
  name: str(f, "name"),
  email: optStr(f, "email"),
  whatsapp: optStr(f, "whatsapp"),
  timezone: str(f, "timezone"),
  subjects: optStr(f, "subjects"),
  meetingUrl: optStr(f, "meetingUrl"),
  payPerLessonEgp: str(f, "payPerLessonEgp") || "0",
  status: (str(f, "status") || "active") as TeacherInput["status"],
});

export async function createTeacherAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  let id = 0;
  const r = await run(async () => {
    id = (await createTeacher(getDb(), read(f), u.id)).id;
  });
  if (r?.error) return r;
  redirect(`/teachers/${id}`);
}

export async function updateTeacherAction(id: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(() => updateTeacher(getDb(), id, read(f), u.id));
  revalidatePath(`/teachers/${id}`);
  return r;
}

export async function closeMonthAction(teacherId: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireAdmin();
  const month = str(f, "month");
  const r = await run(async () => {
    assert(/^\d{4}-\d{2}$/.test(month), "الشهر مش صحيح");
    await closeTeacherMonth(getDb(), teacherId, month, u.id);
    return "اتقفل الشهر واتثبت المبلغ";
  });
  revalidatePath(`/teachers/${teacherId}`);
  return r;
}

export async function markPaidAction(teacherId: number, payoutId: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireAdmin();
  const r = await run(async () => {
    const d = str(f, "paidOn");
    assert(/^\d{4}-\d{2}-\d{2}$/.test(d), "التاريخ مش صحيح");
    await markPayoutPaid(getDb(), payoutId, d, u.id);
    return "اتسجل الصرف";
  });
  revalidatePath(`/teachers/${teacherId}`);
  return r;
}
