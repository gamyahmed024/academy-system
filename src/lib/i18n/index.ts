import ar, { type Dict } from "./ar";
import en from "./en";
import fr from "./fr";
import de from "./de";
import es from "./es";
import tr from "./tr";
import ru from "./ru";
import { ERRORS } from "./errors";

/**
 * Languages of the login page and the teacher / student / guardian pages.
 * To add one: copy en.ts, translate it, and list it here and in errors.ts.
 * Staff pages stay in Arabic.
 */
export const LANGS = { ar, en, fr, de, es, tr, ru } as const;
export type Lang = keyof typeof LANGS;
export const LANG_CODES = Object.keys(LANGS) as Lang[];
export const LANG_COOKIE = "lang";

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && v in LANGS;
}

/** Best language from an Accept-Language header; English for anything we don't have. */
export function pickLang(acceptLanguage: string | null | undefined): Lang {
  for (const part of (acceptLanguage ?? "").split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return "en";
}

export type Key = keyof Dict;

/**
 * Translator for one language, with {placeholders}. Values are wrapped in
 * Unicode isolates so an Arabic name inside an English sentence (or the
 * reverse) keeps the sentence in the right order.
 */
export function translator(lang: Lang) {
  const d = LANGS[lang] ?? en;
  return (key: Key, vars: Record<string, string | number> = {}) =>
    d[key].replace(/\{(\w+)\}/g, (_, k) => (k in vars ? `\u2068${vars[k]}\u2069` : `{${k}}`));
}
export type T = ReturnType<typeof translator>;

/** Business errors are written in Arabic; show them in the user's language when we know them. */
export function translateError(lang: Lang, message: string): string {
  if (lang === "ar") return message;
  return ERRORS[message]?.[lang] ?? message;
}

export const dateLocale = (lang: Lang) => LANGS[lang].dateLocale;
export const dirOf = (lang: Lang) => LANGS[lang].dir as "rtl" | "ltr";

/** A readable zone name without our Arabic labels, e.g. "Europe/Berlin" → "Berlin". */
export function zoneName(tz: string): string {
  return (tz.split("/").pop() ?? tz).replace(/_/g, " ");
}

/** Arabic labels for our common zones, the city name otherwise. */
export function zoneLabel(lang: Lang, tz: string, arLabel: (tz: string) => string): string {
  return lang === "ar" ? arLabel(tz) : zoneName(tz);
}
