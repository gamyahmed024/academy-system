import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/server/lang";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { dirOf } from "@/lib/i18n";
import { nameFor } from "@/lib/academy-name";
import { INSTALL_PROMPT_SCRIPT } from "@/lib/install";
import { OG_IMAGE } from "@/lib/og-image";

export async function generateMetadata(): Promise<Metadata> {
  const academyName = nameFor(await getSettings(getDb()), await getLang());
  return {
    title: { default: academyName, template: `%s · ${academyName}` },
    description: "نظام إدارة أكاديمية تعليم الأجانب",
    applicationName: academyName,
    // the picture WhatsApp, Facebook, Telegram and X show when the site link is shared
    openGraph: { type: "website", siteName: academyName, title: academyName, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
    // opened from the iPhone home screen it runs full-screen like an app
    appleWebApp: { capable: true, title: academyName, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = { themeColor: "#0c2f4a" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={dirOf(lang)} className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
