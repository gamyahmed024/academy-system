"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { recordPayment } from "@/server/services/money";
import { run, str, optStr, type ActionState } from "@/server/action";

export async function createPaymentAction(_: ActionState, f: FormData): Promise<ActionState> {
  const u = await requireStaff();
  let id = 0;
  const payer = str(f, "payer"); // "s:12" or "g:3"
  const [kind, raw] = payer.split(":");
  const currency = str(f, "currency");
  const r = await run(async () => {
    const p = await recordPayment(
      getDb(),
      {
        studentId: kind === "s" ? Number(raw) : null,
        guardianId: kind === "g" ? Number(raw) : null,
        amount: str(f, "amount"),
        currency,
        rateToEgp: currency === "EGP" ? "1" : str(f, "rateToEgp"),
        lessonsCredited: Number(str(f, "lessonsCredited") || "0"),
        method: str(f, "method"),
        paidOn: str(f, "paidOn"),
        note: optStr(f, "note"),
      },
      u.id,
    );
    id = p.id;
  });
  if (r?.error) return r;
  redirect(`/payments/${id}`);
}
