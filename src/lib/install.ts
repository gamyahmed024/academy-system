import type { Dict } from "@/lib/i18n/ar";

/** Texts the install button needs, already in the visitor's language. */
export type InstallTexts = Pick<Dict, "installApp" | "installTitle" | "installIos1" | "installIos2" | "installIos3" | "installOther" | "installOk">;

export function installTexts(d: Dict): InstallTexts {
  const { installApp, installTitle, installIos1, installIos2, installIos3, installOther, installOk } = d;
  return { installApp, installTitle, installIos1, installIos2, installIos3, installOther, installOk };
}

/**
 * Runs in <head> before React loads: keeps the browser's install offer
 * (Android / Chrome) so the button can show it later, and forgets it once
 * the app is installed.
 */
export const INSTALL_PROMPT_SCRIPT =
  'window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e;dispatchEvent(new Event("installprompt-ready"))});' +
  'window.addEventListener("appinstalled",function(){window.__installPrompt=null;window.__appInstalled=true});';
