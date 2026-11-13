"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { run, str, type ActionState } from "@/server/action";
import { updateTrialRequest, markPasswordHelpHandled } from "@/server/services/requests";

export async function updateRequestAction(_: ActionState, f: FormData): Promise<ActionState> {
  await requireStaff();
  const r = await run(() => updateTrialRequest(getDb(), Number(str(f, "id")), str(f, "status"), str(f, "staffNote")));
  revalidatePath("/requests");
  return r;
}

export async function passwordHandledAction(f: FormData) {
  await requireStaff();
  await markPasswordHelpHandled(getDb(), Number(f.get("id")));
  revalidatePath("/requests");
}
