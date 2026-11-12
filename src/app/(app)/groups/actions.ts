"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { createGroup } from "@/server/services/people";
import { run, str, optStr, type ActionState } from "@/server/action";

export async function createGroupAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  const r = await run(async () => {
    await createGroup(
      getDb(),
      {
        name: str(f, "name"),
        teacherId: Number(str(f, "teacherId")),
        level: optStr(f, "level"),
        studentIds: f.getAll("studentIds").map(Number).filter(Number.isInteger),
      },
      u.id,
    );
  });
  if (r?.error) return r;
  redirect("/groups");
}
