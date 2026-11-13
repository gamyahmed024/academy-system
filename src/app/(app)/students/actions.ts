"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { createStudent, updateStudent, type StudentInput } from "@/server/services/people";
import { run, str, optStr, optId, type ActionState } from "@/server/action";
import { linkRequestToStudent } from "@/server/services/requests";

function read(f: FormData): StudentInput {
  return {
    name: str(f, "name"),
    email: optStr(f, "email"),
    whatsapp: optStr(f, "whatsapp"),
    country: optStr(f, "country"),
    nativeLanguage: optStr(f, "nativeLanguage"),
    timezone: str(f, "timezone"),
    subject: optStr(f, "subject"),
    level: optStr(f, "level"),
    status: (str(f, "status") || "active") as StudentInput["status"],
    guardianId: optId(f, "guardianId"),
    notes: optStr(f, "notes"),
  };
}

export async function createStudentAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  let id = 0;
  const r = await run(async () => {
    id = (await createStudent(getDb(), read(f), u.id)).id;
    const requestId = optId(f, "requestId");
    if (requestId) await linkRequestToStudent(getDb(), requestId, id);
  });
  if (r?.error) return r;
  redirect(`/students/${id}`);
}

export async function updateStudentAction(id: number, _: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(() => updateStudent(getDb(), id, read(f), u.id));
  if (r?.error) return r;
  revalidatePath(`/students/${id}`);
  redirect(`/students/${id}`);
}
