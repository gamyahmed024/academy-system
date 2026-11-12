import { Logo } from "@/components/logo";
import Link from "next/link";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { getT } from "@/server/lang";
import { LANDING } from "@/lib/i18n/landing";
import { LANDING_MORE, DEMO_WORDS } from "@/lib/i18n/landing-more";
import { LANDING_PHOTOS as PHOTO } from "@/lib/landing-photos";
import { LangSwitch } from "@/components/lang-switch";
import { Vowelled, WordTry } from "@/components/word-try";
import Image from "next/image";

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
const PROGRAM_PHOTOS = [PHOTO.program1, PHOTO.program2, PHOTO.program3];
const PATH_ICONS = ["🎯", "أ", "✏️", "💬", "📖"];
const WHY_ICONS = ["🕒", "👤", "▶", "↩", "👪", "🌐"];

/** The public page a visitor sees before signing in. */
export default async function Welcome() {
  // Signed-in users can open it too (staff preview it from the sidebar);
  // its sign-in buttons then lead them back to their own home.
  const s = await getSettings(getDb());
  const { lang, t } = await getT();
  const x = LANDING[lang];
  const m = LANDING_MORE[lang];
  const words = DEMO_WORDS.map((w, i) => ({ ...w, meaning: m.meanings[i] }));
  const wa = waLink(s.contactWhatsapp);
  const year = new Date().getFullYear();

  const contactBtn = (cls: string) =>
    wa && (
      <a href={wa} target="_blank" rel="noopener noreferrer" className={cls}>
        {x.contact}
      </a>
    );

  return (
    <div className="bg-ivory text-slate-800">
      <header className="sticky top-0 z-20 bg-sidebar text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={42} />
            <span className="truncate text-lg font-extrabold">{s.academyName}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LangSwitch current={lang} label={t("language")} />
            <Link href="/login" className="hidden rounded-lg border border-white/40 px-3 py-1.5 text-sm font-bold hover:bg-white/10 sm:inline-block">
              {x.signIn}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-sidebar via-brand-dark to-brand text-white">
        <div aria-hidden className="pointer-events-none absolute -end-10 -top-16 select-none text-[22rem] leading-none font-extrabold text-sky opacity-[0.12]">
          ض
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-sky">{x.heroTag}</p>
            <h1 className="max-w-3xl text-3xl leading-snug font-extrabold sm:text-5xl sm:leading-tight">{x.heroTitle}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">{x.heroText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {contactBtn("rounded-xl bg-accent px-6 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110")}
              <Link href="/login" className="rounded-xl border-2 border-white/70 px-6 py-3 font-bold transition hover:bg-white/10">
                {x.signIn}
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl ring-4 ring-white/20">
              <Image src={PHOTO.hero.src} alt="" fill priority unoptimized sizes="(min-width: 1024px) 560px, 100vw" className="drift object-cover" />
              <Image src={PHOTO.program2.src} alt="" fill unoptimized sizes="(min-width: 1024px) 560px, 100vw" className="hero-second object-cover" />
              <Image src={PHOTO.program1.src} alt="" fill unoptimized sizes="(min-width: 1024px) 560px, 100vw" className="hero-third object-cover" />
            </div>
            <div className="float-soft absolute -bottom-6 start-4 rounded-2xl bg-white px-5 py-3 text-center shadow-xl sm:start-8">
              <div dir="rtl" lang="ar" className="text-2xl leading-relaxed font-bold text-sidebar">
                <Vowelled text={words[0].ar} />
              </div>
              <div className="ltr text-sm text-brand italic">{words[0].tr}</div>
              <div className="text-sm font-semibold text-slate-600">{words[0].meaning}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="reveal mb-10 text-center text-2xl font-extrabold text-brand sm:text-3xl">{x.programsTitle}</h2>
        <div className="grid gap-7 md:grid-cols-3">
          {x.programs.map(([title, text], i) => (
            <div key={title} className="reveal lift overflow-hidden rounded-3xl border border-slate-200/70 bg-white text-center shadow-sm">
              <div className="zoom-frame relative aspect-[3/2] overflow-hidden">
                <Image src={PROGRAM_PHOTOS[i].src} alt="" fill unoptimized sizes="(min-width: 768px) 370px, 100vw" className="drift object-cover" style={{ animationDelay: `${-i * 5}s` }} />
              </div>
              <div className="px-6 pb-7">
                <div className="relative mx-auto -mt-8 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl font-extrabold text-brand shadow-md ring-1 ring-slate-100">
                  {PROGRAM_ICONS[i]}
                </div>
                <h3 className="mb-2 text-lg font-bold">{title}</h3>
                <p className="leading-7 text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sand/60">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="reveal text-center text-2xl font-extrabold text-brand sm:text-3xl">{m.pathTitle}</h2>
          <p className="reveal mx-auto mt-3 mb-12 max-w-xl text-center text-lg text-slate-600">{m.pathText}</p>
          <ol className="relative grid gap-8 lg:grid-cols-5 lg:gap-4">
            <span aria-hidden className="absolute start-7 top-0 bottom-0 border-s-2 border-dashed border-brand/30 lg:inset-x-[10%] lg:top-7 lg:bottom-auto lg:border-s-0 lg:border-t-2" />
            {m.path.map(([title, text], i) => (
              <li key={title} className="reveal relative flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-extrabold text-brand shadow-md ring-4 ring-brand-soft transition duration-300 hover:scale-110 hover:ring-sky">
                  {PATH_ICONS[i]}
                </span>
                <div className="lg:mt-4">
                  <div className="text-xs font-bold tracking-wide text-accent">{i + 1} / {m.path.length}</div>
                  <h3 className="mb-1 text-lg font-bold">{title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="reveal text-2xl font-extrabold text-brand sm:text-3xl">{m.tryTitle}</h2>
        <p className="reveal mt-3 text-lg text-slate-600">{m.tryText}</p>
        <div className="reveal mt-8 rounded-3xl border border-slate-200/70 bg-white px-4 pt-10 pb-6 shadow-sm sm:px-8">
          <WordTry words={words} listen={m.listen} rootLabel={m.rootLabel} close={m.close} lang={lang} />
          <p className="text-slate-700">{m.sentenceMeaning}</p>
          <p className="mt-2 text-sm text-slate-500">
            <span aria-hidden>👆</span> {m.tryHint}
          </p>
        </div>
      </section>

      <section className="bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="reveal mb-10 text-center text-2xl font-extrabold sm:text-3xl">{x.stepsTitle}</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {x.steps.map(([title, text], i) => (
              <li key={title} className="reveal rounded-3xl bg-white/10 p-7 transition hover:bg-white/15">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-xl font-extrabold">{i + 1}</span>
                <h3 className="mb-1 text-lg font-bold">{title}</h3>
                <p className="leading-7 text-white/85">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="reveal mb-10 text-center text-2xl font-extrabold text-brand sm:text-3xl">{x.whyTitle}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {x.why.map(([title, text], i) => (
            <div key={title} className="reveal lift flex gap-4 rounded-2xl border border-slate-200/70 bg-white p-6">
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

      <section className="relative isolate overflow-hidden text-white">
        <Image src={PHOTO.culture.src} alt="" fill unoptimized sizes="100vw" className="band-slide -z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-sidebar/60" />
        <div className="reveal mx-auto max-w-3xl px-4 py-24 text-center">
          <h2 className="text-2xl font-extrabold sm:text-4xl">{m.cultureTitle}</h2>
          <p className="mt-4 text-lg leading-8 text-white/90">{m.cultureText}</p>
        </div>
      </section>

      <section className="bg-accent-soft">
        <div className="reveal mx-auto max-w-3xl px-4 py-20 text-center">
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
        <p>
          © {year} {s.academyName} · {x.rights}
        </p>
        <details className="mx-auto mt-2 max-w-3xl text-xs opacity-80">
          <summary className="cursor-pointer">{m.credits}</summary>
          <ul className="ltr mt-2 space-y-1">
            {Object.values(PHOTO).map((p) => (
              <li key={p.src}>
                <a href={p.source} target="_blank" rel="noopener noreferrer" className="underline">
                  {p.title}
                </a>
                {" · "}
                {p.author} · {p.license}
              </li>
            ))}
          </ul>
        </details>
      </footer>
    </div>
  );
}
