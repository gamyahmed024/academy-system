/**
 * The link-preview picture (1200x630) shown when the site is shared on
 * WhatsApp, Facebook, Telegram or X. Designed in Canva; the background is the
 * CC0 Alhambra photo also used on /welcome (see landing-photos.ts). To change it,
 * replace public/og-image.jpg with another 1200x630 image (keep it small: WhatsApp skips big ones).
 * Next.js turns this relative URL into a full one using the site's address on Vercel.
 */
export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Umam Academy · أكاديمية أمم لتعليم العربية لغير الناطقين بها",
};
