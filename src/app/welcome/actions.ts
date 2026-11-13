"use server";

import { getDb } from "@/db";
import { getLang } from "@/server/lang";
import { str, type ActionState } from "@/server/action";
import { createTrialRequest } from "@/server/services/requests";
import { LANDING_MORE } from "@/lib/i18n/landing-more";

/** A visitor asks for a free trial lesson from the welcome page. */
export async function requestTrial(_: ActionState, f: FormData): Promise<ActionState> {
  const lang = await getLang();
  const t = LANDING_MORE[lang].trial;
  // Bots fill every field; people never see this one.
  if (str(f, "website")) return { ok: t.sent };
  try {
    const problem = await createTrialRequest(getDb(), {
      name: str(f, "name"),
      email: str(f, "email"),
      whatsapp: str(f, "whatsapp"),
      country: str(f, "country"),
      timezone: str(f, "timezone"),
      level: str(f, "level"),
      forWhom: str(f, "forWhom"),
      preferredTimes: str(f, "preferredTimes"),
      message: str(f, "message"),
      lang,
    });
    return problem ? { error: t.problems[problem] } : { ok: t.sent };
  } catch (e) {
    console.error(e);
    return { error: t.problems.other };
  }
}
