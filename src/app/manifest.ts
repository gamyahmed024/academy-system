import type { MetadataRoute } from "next";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";

// Lets the system be installed as an icon on the desktop or phone (PWA).
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings(getDb());
  return {
    name: `${s.academyNameLatin} · ${s.academyName}`,
    short_name: s.academyNameLatin,
    description: "نظام إدارة أكاديمية تعليم الأجانب",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#f5f7f9",
    theme_color: "#0c2f4a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Android crops icons into its own shape; this one keeps the logo inside the safe area
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
