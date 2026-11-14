"use client";

import { useState, useSyncExternalStore } from "react";
import type { InstallTexts } from "@/lib/install";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window {
    /** Saved by the inline script in the root layout, which runs before React loads. */
    __installPrompt?: PromptEvent | null;
    __appInstalled?: boolean;
  }
}

type Kind = "hidden" | "prompt" | "ios" | "other";

function detect(): Kind {
  const nav = navigator as Navigator & { standalone?: boolean };
  // already opened from the home screen: nothing to install
  if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone || window.__appInstalled) return "hidden";
  if (window.__installPrompt) return "prompt";
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return "ios";
  // other phones whose browser has not offered a prompt (yet): explain the menu
  if (/android|mobile/i.test(ua)) return "other";
  return "hidden";
}

function subscribe(onChange: () => void) {
  window.addEventListener("installprompt-ready", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    window.removeEventListener("installprompt-ready", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

/**
 * "Install the app" button. Android / Chrome shows the browser's own install
 * dialog; iPhone (where websites can't trigger it) gets a three-step guide.
 * Hidden when the app is already installed, and on computers without a prompt.
 */
export function InstallApp({ texts, className = "" }: { texts: InstallTexts; className?: string }) {
  const kind = useSyncExternalStore(subscribe, detect, () => "hidden" as Kind);
  const [guide, setGuide] = useState(false);

  if (kind === "hidden") return null;

  async function onClick() {
    const ev = window.__installPrompt;
    if (ev) {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      // the browser offers its dialog only once per page
      window.__installPrompt = null;
      if (outcome === "accepted") window.__appInstalled = true;
      window.dispatchEvent(new Event("installprompt-ready"));
      return;
    }
    setGuide(true);
  }

  return (
    <>
      <button type="button" onClick={onClick} className={className}>
        <span aria-hidden>📲 </span>
        {texts.installApp}
      </button>
      {guide && (
        <div role="dialog" aria-modal="true" aria-label={texts.installTitle} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setGuide(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-start text-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-extrabold text-brand">{texts.installTitle}</h2>
            {kind === "ios" ? (
              <ol className="list-decimal space-y-3 ps-5 leading-7">
                <li>{texts.installIos1}</li>
                <li>{texts.installIos2}</li>
                <li>{texts.installIos3}</li>
              </ol>
            ) : (
              <p className="leading-7">{texts.installOther}</p>
            )}
            <button type="button" onClick={() => setGuide(false)} className="btn mt-6 w-full">
              {texts.installOk}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

