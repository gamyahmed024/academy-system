import type { MetadataRoute } from "next";

// Lets the system be installed as an icon on the desktop or phone (PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "إدارة الأكاديمية",
    short_name: "الأكاديمية",
    description: "نظام إدارة أكاديمية تعليم الأجانب",
    start_url: "/",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#f5f7f9",
    theme_color: "#0f6e6e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
