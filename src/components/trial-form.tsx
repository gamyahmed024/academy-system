"use client";

import { useActionState, startTransition } from "react";
import type { ActionState } from "@/server/action";
import type { TrialText } from "@/lib/i18n/landing-more";

const LEVEL_VALUES = ["none", "basic", "intermediate", "advanced"];

/** The free-trial request form on the welcome page. */
export function TrialForm({ t, action }: { t: TrialText; action: (s: ActionState, f: FormData) => Promise<ActionState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  if (state?.ok)
    return (
      <div role="status" className="pop-in rounded-2xl bg-brand-soft p-8 text-center text-lg font-bold text-brand">
        <div aria-hidden className="mb-2 text-4xl">✓</div>
        {state.ok}
      </div>
    );

  const field = "input !py-2.5 !text-base";
  const lbl = (text: string, optional?: boolean) => (
    <span className="label">
      {text}
      {optional && <span className="ms-1 font-normal text-slate-400">({t.optional})</span>}
    </span>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        // The visitor's own time zone, so staff see when "evening" is for them.
        data.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
        startTransition(() => formAction(data));
      }}
      className="grid gap-4 text-start sm:grid-cols-2"
    >
      <label>
        {lbl(t.name)}
        <input name="name" required minLength={2} maxLength={120} autoComplete="name" className={field} />
      </label>
      <label>
        {lbl(t.email)}
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={`${field} ltr`} />
      </label>
      <label>
        {lbl(t.whatsapp, true)}
        <input name="whatsapp" type="tel" maxLength={40} autoComplete="tel" placeholder={t.whatsappHint} className={`${field} ltr`} />
      </label>
      <label>
        {lbl(t.country, true)}
        <input name="country" maxLength={80} autoComplete="country-name" className={field} />
      </label>
      <fieldset>
        <legend className="label">{t.forWhom}</legend>
        <div className="flex gap-2">
          {(
            [
              ["me", t.forMe],
              ["child", t.forChild],
            ] as const
          ).map(([v, l], i) => (
            <label key={v} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:font-bold has-[:checked]:text-brand">
              <input type="radio" name="forWhom" value={v} defaultChecked={i === 0} className="accent-[var(--brand)]" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        {lbl(t.level)}
        <select name="level" required defaultValue="none" className={field}>
          {LEVEL_VALUES.map((v, i) => (
            <option key={v} value={v}>
              {t.levels[i]}
            </option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        {lbl(t.times, true)}
        <input name="preferredTimes" maxLength={300} placeholder={t.timesHint} className={field} />
      </label>
      <label className="sm:col-span-2">
        {lbl(t.message, true)}
        <textarea name="message" rows={3} maxLength={1000} className={field} />
      </label>
      {/* Hidden from people; bots that fill it are ignored. */}
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-xl bg-accent px-7 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60">
          {pending ? t.sending : t.send}
        </button>
        {state?.error && (
          <p role="alert" className="font-semibold text-red-700">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
