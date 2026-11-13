"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items: { href: string; label: string; admin?: boolean }[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/schedule", label: "الجدول" },
  { href: "/requests", label: "طلبات تجريبية" },
  { href: "/students", label: "الطلاب" },
  { href: "/families", label: "العائلات" },
  { href: "/teachers", label: "المدرسين" },
  { href: "/groups", label: "المجموعات" },
  { href: "/payments", label: "المدفوعات" },
  { href: "/reports", label: "التقارير", admin: true },
  { href: "/settings", label: "الإعدادات", admin: true },
];

export function Nav({ isAdmin, newRequests = 0 }: { isAdmin: boolean; newRequests?: number }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {items
        .filter((i) => !i.admin || isAdmin)
        .map((i) => {
          const on = i.href === "/" ? path === "/" : path.startsWith(i.href) || (i.href === "/schedule" && path.startsWith("/lessons"));
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                on ? "bg-brand text-white" : "text-sidebar-text hover:bg-white/10"
              }`}
            >
              {i.label}
              {i.href === "/requests" && newRequests > 0 && (
                <span className="ms-2 rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold text-white">{newRequests}</span>
              )}
            </Link>
          );
        })}
    </nav>
  );
}
