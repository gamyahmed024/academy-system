/** The academy's name for a reader: Arabic for Arabic pages, the Latin name everywhere else. */
export function nameFor(s: { academyName: string; academyNameLatin: string }, lang: string): string {
  return lang === "ar" ? s.academyName : s.academyNameLatin || s.academyName;
}
