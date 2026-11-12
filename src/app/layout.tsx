import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "إدارة الأكاديمية", template: "%s · إدارة الأكاديمية" },
  description: "نظام إدارة أكاديمية تعليم الأجانب",
  applicationName: "إدارة الأكاديمية",
};

export const viewport: Viewport = { themeColor: "#0f6e6e" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
