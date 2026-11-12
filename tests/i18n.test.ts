import { describe, it, expect } from "vitest";
import { LANGS, LANG_CODES, pickLang, translator, translateError, type Lang } from "@/lib/i18n";
import { ERRORS } from "@/lib/i18n/errors";
import ar from "@/lib/i18n/ar";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("translations", () => {
  it("every language has every text, with the same placeholders", () => {
    for (const code of LANG_CODES) {
      const d = LANGS[code];
      for (const k of Object.keys(ar) as (keyof typeof ar)[]) {
        expect(d[k], `${code}.${k}`).toBeTruthy();
        expect(placeholders(d[k]), `${code}.${k}`).toBe(placeholders(ar[k]));
      }
    }
  });

  it("every known error is translated into every non-Arabic language", () => {
    for (const [msg, tr] of Object.entries(ERRORS)) {
      for (const code of LANG_CODES.filter((c) => c !== "ar")) expect(tr[code as Exclude<Lang, "ar">], `${code}: ${msg}`).toBeTruthy();
    }
  });

  it("picks the browser language, falling back to English", () => {
    expect(pickLang("de-DE,de;q=0.9,en;q=0.8")).toBe("de");
    expect(pickLang("ar-EG")).toBe("ar");
    expect(pickLang("ja-JP,ja;q=0.9")).toBe("en");
    expect(pickLang("ja-JP,ru;q=0.5")).toBe("ru");
    expect(pickLang(null)).toBe("en");
  });

  it("fills placeholders and translates errors", () => {
    const plain = (s: string) => s.replace(/[\u2068\u2069]/g, "");
    expect(plain(translator("en")("hello", { name: "Anna" }))).toBe("Hello Anna");
    expect(plain(translator("ru")("minutes", { n: 60 }))).toBe("60 мин");
    // values are isolated so mixed Arabic/Latin text keeps its order
    expect(translator("en")("withTeacher", { name: "أ. سارة" })).toBe("with \u2068أ. سارة\u2069");
    expect(translateError("fr", "مش مسموح")).toBe("Non autorisé");
    expect(translateError("ar", "مش مسموح")).toBe("مش مسموح");
    expect(translateError("de", "رسالة مش معروفة")).toBe("رسالة مش معروفة");
  });
});

import { LANDING } from "@/lib/i18n/landing";

describe("welcome page text", () => {
  it("has the same shape in every language", () => {
    for (const code of LANG_CODES) {
      const x = LANDING[code];
      expect(x.programs, code).toHaveLength(3);
      expect(x.steps, code).toHaveLength(3);
      expect(x.why, code).toHaveLength(6);
      expect(x.why[3][1], code).toContain("{h}");
      for (const [a, b] of [...x.programs, ...x.steps, ...x.why]) expect(a && b, code).toBeTruthy();
    }
  });
});

import { LANDING_MORE, DEMO_WORDS } from "@/lib/i18n/landing-more";

describe("welcome page extras", () => {
  it("has every station and a meaning for every demo word", () => {
    for (const code of LANG_CODES) {
      const m = LANDING_MORE[code];
      expect(m.path, code).toHaveLength(5);
      expect(m.meanings, code).toHaveLength(DEMO_WORDS.length);
      for (const [a, b] of m.path) expect(a && b, code).toBeTruthy();
      for (const v of [...m.meanings, m.pathTitle, m.tryTitle, m.tryHint, m.listen, m.cultureTitle, m.cultureText, m.credits]) expect(v, code).toBeTruthy();
    }
  });
});
