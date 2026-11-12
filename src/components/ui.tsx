import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, tone }: { label: string; value: ReactNode; tone?: "red" | "green" | "accent" }) {
  const color = tone === "red" ? "text-red-600" : tone === "green" ? "text-green-700" : tone === "accent" ? "text-accent" : "text-slate-900";
  return (
    <div className="card !p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

const badgeTones = {
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
  accent: "bg-accent-soft text-accent",
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-slate-100 text-slate-600",
  brand: "bg-brand-soft text-brand",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function BalanceBadge({ balance, threshold = 1 }: { balance: number; threshold?: number }) {
  const tone = balance < 0 ? "red" : balance <= threshold ? "accent" : "green";
  return <Badge tone={tone}>{balance} حصة</Badge>;
}

const statusLabels: Record<string, [string, keyof typeof badgeTones]> = {
  trial: ["تجريبي", "blue"],
  active: ["نشط", "green"],
  paused: ["متوقف مؤقتًا", "accent"],
  stopped: ["منتهي", "gray"],
  scheduled: ["مجدولة", "blue"],
  done: ["اتسجلت", "green"],
  cancelled: ["ملغية", "gray"],
};

export function StatusBadge({ status }: { status: string }) {
  const [label, tone] = statusLabels[status] ?? [status, "gray"];
  return <Badge tone={tone}>{label}</Badge>;
}

export const STATUS_OPTIONS = [
  ["active", "نشط"],
  ["trial", "تجريبي"],
  ["paused", "متوقف مؤقتًا"],
  ["stopped", "منتهي"],
] as const;

export function BackLink({ href, children, ltr }: { href: string; children: ReactNode; ltr?: boolean }) {
  return (
    <Link href={href} className="mb-3 inline-block text-sm text-slate-500 hover:text-brand">
      {ltr ? "←" : "→"} {children}
    </Link>
  );
}

export function JoinButton({ url, small, label = "▶ ادخل الحصة", noLink = "مفيش رابط" }: { url: string | null; small?: boolean; label?: string; noLink?: string }) {
  if (!url) return <span className="text-xs text-slate-400">{noLink}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`btn ${small ? "btn-sm" : ""}`}>
      {label}
    </a>
  );
}

/** wa.me link with a ready-made message; the admin sends it themselves. */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
