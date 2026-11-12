"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requirePortal, requireRole } from "@/server/session";
import { excuseLesson, teacherRecordAttendance } from "@/server/services/portal";
import { changePassword, verifyLogin } from "@/server/services/auth";
import { run, str, type ActionState } from "@/server/action";
import { assert } from "@/server/services/errors";
import type { AttendanceState } from "@/lib/domain/rules";

export async function excuseAction(lessonId: number, studentId: number): Promise<ActionState> {
  const u = await requireRole("student", "guardian");
  const r = await run(async () => {
    const d = await excuseLesson(getDb(), u, lessonId, studentId);
    return d.deducted
      ? "اتسجل الاعتذار. الاعتذار جه متأخر عن المهلة، فالحصة هتتخصم من الرصيد"
      : "اتسجل الاعتذار، والحصة مش هتتخصم";
  });
  revalidatePath("/my");
  return r;
}

export async function teacherAttendanceAction(lessonId: number, studentId: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireRole("teacher");
  const r = await run(async () => {
    await teacherRecordAttendance(getDb(), u, {
      lessonId,
      studentId,
      state: str(f, "state") as AttendanceState,
      note: str(f, "note") || null,
    });
    return "اتسجل";
  });
  revalidatePath(`/my/lessons/${lessonId}`);
  return r;
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
  if (r?.error) return r;
  redirect("/login?changed=1");
}
