import Link from "next/link";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { getT } from "@/server/lang";
import { LANDING } from "@/lib/i18n/landing";
import { LangSwitch } from "@/components/lang-switch";

export async function generateMetadata() {
  const { lang } = await getT();
  const s = await getSettings(getDb());
  return { title: { absolute: s.academyName }, description: LANDING[lang].metaDesc };
}

/** Digits only, as wa.me wants them. */
function waLink(n: string | null) {
  const d = (n ?? "").replace(/\D/g, "");
  return d.length >= 8 ? `https://wa.me/${d}` : null;
}

const PROGRAM_ICONS = ["أ", "💬", "📖"];
const WHY_ICONS = ["🕒", "👤", "▶", "↩", "👪", "🌐"];

/** The public page a visitor sees before signing in. */
export default async function Welcome() {
  // Signed-in users can open it too (staff preview it from the sidebar);
  // its sign-in buttons then lead them back to their own home.
  const s = await getSettings(getDb());
  const { lang, t } = await getT();
  const x = LANDING[lang];
  const wa = waLink(s.contactWhatsapp);
  const year = new Date().getFullYear();

  const contactBtn = (cls: string) =>
    wa && (
      <a href={wa} target="_blank" rel="noopener noreferrer" className={cls}>
        {x.contact}
      </a>
    );

  return (
    <div className="bg-white text-slate-800">
      <header className="sticky top-0 z-20 bg-sidebar text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-xl font-extrabold">
              {s.academyName.slice(0, 1)}
            </span>
            <span className="truncate text-lg font-extrabold">{s.academyName}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LangSwitch current={lang} label={t("language")} />
            <Link href="/login" className="rounded-lg border border-white/40 px-3 py-1.5 text-sm font-bold hover:bg-white/10">
              {x.signIn}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-sidebar via-brand-dark to-brand text-white">
        <div aria-hidden className="pointer-events-none absolute -end-10 -top-16 select-none text-[22rem] leading-none font-extrabold opacity-[0.06]">
          ض
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-accent-soft">{x.heroTag}</p>
          <h1 className="max-w-3xl text-3xl leading-snug font-extrabold sm:text-5xl sm:leading-tight">{x.heroTitle}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">{x.heroText}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {contactBtn("rounded-xl bg-accent px-6 py-3 font-bold text-white shadow-lg hover:brightness-110")}
            <Link href="/login" className="rounded-xl border-2 border-white/70 px-6 py-3 font-bold hover:bg-white/10">
              {x.signIn}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-brand sm:text-3xl">{x.programsTitle}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {x.programs.map(([title, text], i) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-3xl font-extrabold text-brand">
                {PROGRAM_ICONS[i]}
              </div>
              <h3 className="mb-2 text-lg font-bold">{title}</h3>
              <p className="leading-7 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">{x.stepsTitle}</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {x.steps.map(([title, text], i) => (
              <li key={title} className="rounded-2xl bg-white/10 p-6">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-xl font-extrabold">{i + 1}</span>
                <h3 className="mb-1 text-lg font-bold">{title}</h3>
                <p className="leading-7 text-white/85">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-brand sm:text-3xl">{x.whyTitle}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {x.why.map(([title, text], i) => (
            <div key={title} className="flex gap-4 rounded-2xl bg-slate-50 p-5">
              <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                {WHY_ICONS[i]}
              </span>
              <div>
                <h3 className="mb-1 font-bold">{title}</h3>
                <p className="text-sm leading-7 text-slate-600">{text.replace("{h}", String(s.freeCancelHours))}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-accent-soft">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{x.ctaTitle}</h2>
          {wa && <p className="mt-3 text-lg text-slate-700">{x.ctaText}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {contactBtn("rounded-xl bg-brand px-6 py-3 font-bold text-white shadow hover:bg-brand-dark")}
            <Link href="/login" className="rounded-xl border-2 border-brand px-6 py-3 font-bold text-brand hover:bg-white">
              {x.signIn}
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-sidebar px-4 py-6 text-center text-sm text-sidebar-text">
        © {year} {s.academyName} · {x.rights}
      </footer>
    </div>
  );
}
