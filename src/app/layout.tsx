import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLang } from "@/server/lang";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { dirOf } from "@/lib/i18n";
import { nameFor } from "@/lib/academy-name";

export async function generateMetadata(): Promise<Metadata> {
  const academyName = nameFor(await getSettings(getDb()), await getLang());
  return {
    title: { default: academyName, template: `%s · ${academyName}` },
    description: "نظام إدارة أكاديمية تعليم الأجانب",
    applicationName: academyName,
  };
}

export const viewport: Viewport = { themeColor: "#0c2f4a" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={dirOf(lang)} className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
