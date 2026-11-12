import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { isLang, pickLang, translator, LANG_COOKIE, type Lang } from "@/lib/i18n";

/** Language of the login page and portal pages: saved choice, else the browser's. */
export const getLang = cache(async (): Promise<Lang> => {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  return pickLang((await headers()).get("accept-language"));
});

export async function getT() {
  const lang = await getLang();
  return { lang, t: translator(lang) };
}
