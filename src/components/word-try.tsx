"use client";

import { useEffect, useRef, useState } from "react";

const MARKS = /[ً-ْٰ]/g;

/**
 * Arabic text with its vowel marks in the accent colour. The marks are drawn
 * by a coloured copy underneath; a mark-free copy on top covers the letters.
 * Splitting letters and marks into separate elements would break the joining.
 */
export function Vowelled({ text }: { text: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span aria-hidden className="text-accent">{text}</span>
      <span className="absolute inset-0">{text.replace(MARKS, "")}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

export type DemoWord = { ar: string; tr: string; root?: string; meaning: string };

/** A sentence whose words open a small card: vowelled form, sound, meaning, root. */
export function WordTry({ words, listen, rootLabel, close, lang }: { words: DemoWord[]; listen: string; rootLabel: string; close: string; lang: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // The listen button only shows where the device has an Arabic voice.
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const check = () => setCanSpeak(synth.getVoices().some((v) => v.lang.toLowerCase().startsWith("ar")));
    check();
    synth.addEventListener("voiceschanged", check);
    return () => synth.removeEventListener("voiceschanged", check);
  }, []);

  useEffect(() => {
    if (open === null) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const say = (text: string) => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = 0.8;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("ar"));
    if (voice) u.voice = voice;
    synth.cancel();
    synth.speak(u);
  };

  const w = open === null ? null : words[open];

  return (
    <div ref={box} dir="rtl" lang="ar">
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-3 text-3xl leading-loose font-bold text-sidebar sm:text-5xl sm:leading-loose">
        {words.map((word, i) => (
          <button
            key={word.ar}
            type="button"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
            className={`cursor-pointer rounded-xl px-2.5 transition duration-200 hover:-translate-y-0.5 hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand ${
              open === i ? "bg-brand-soft shadow-sm ring-2 ring-sky" : "border-b-2 border-dashed border-sky/60"
            }`}
          >
            <Vowelled text={word.ar} />
          </button>
        ))}
      </div>

      {/* Reserved height, so the page does not jump when a card opens. */}
      <div className="mt-6 flex min-h-36 justify-center" aria-live="polite">
        {w && (
          <div key={w.ar} className="pop-in relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-xl">
            <button type="button" onClick={() => setOpen(null)} aria-label={close} className="absolute end-2 top-2 h-8 w-8 cursor-pointer rounded-full text-slate-400 hover:bg-slate-100">
              ✕
            </button>
            <div className="text-3xl leading-relaxed font-bold text-sidebar">
              <Vowelled text={w.ar} />
            </div>
            <div className="ltr mt-1 text-lg text-brand italic" lang="ar-Latn">{w.tr}</div>
            <div className="mt-2 text-lg font-semibold text-slate-800" dir="auto" lang={lang}>{w.meaning}</div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {w.root && (
                <span dir={lang === "ar" ? "rtl" : "ltr"} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
                  <span lang={lang}>{rootLabel}</span>: <bdi>{w.root}</bdi>
                </span>
              )}
              {canSpeak && (
                <button type="button" onClick={() => say(w.ar)} className="btn btn-sm cursor-pointer">
                  <span aria-hidden>🔊</span> <span dir="auto" lang={lang}>{listen}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
