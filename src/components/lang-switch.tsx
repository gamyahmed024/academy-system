"use client";

import { useRef } from "react";
import { LANGS, LANG_CODES, type Lang } from "@/lib/i18n";
import { setLanguage } from "@/app/lang-actions";

/** Language picker that applies on change. */
export function LangSwitch({ current, label, className = "" }: { current: Lang; label: string; className?: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setLanguage} className={className}>
      <label className="flex items-center gap-1.5">
        <span aria-hidden>🌐</span>
        <span className="sr-only">{label}</span>
        <select
          name="lang"
          defaultValue={current}
          onChange={() => form.current?.requestSubmit()}
          className="cursor-pointer rounded-md border border-current/30 bg-transparent px-1.5 py-0.5 text-sm"
          aria-label={label}
        >
          {LANG_CODES.map((c) => (
            <option key={c} value={c} className="text-slate-900">{LANGS[c].langName}</option>
          ))}
        </select>
      </label>
    </form>
  );
}
