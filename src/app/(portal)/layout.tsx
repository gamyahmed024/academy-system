import Link from "next/link";
import { requirePortal } from "@/server/session";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { logout } from "../login/actions";

const ROLE_LABEL = { teacher: "مدرس", student: "طالب", guardian: "ولي أمر" } as const;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortal();
  const s = await getSettings(getDb());
  return (
    <div className="min-h-screen">
      <header className="bg-sidebar text-sidebar-text">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/my" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-extrabold text-white">{s.academyName.slice(0, 1)}</span>
            <span className="font-extrabold text-white">{s.academyName}</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span>
              <span className="font-semibold text-white">{user.name}</span> · {ROLE_LABEL[user.role as keyof typeof ROLE_LABEL]}
            </span>
            <Link href="/my/password" className="underline hover:text-white">كلمة السر</Link>
            <form action={logout}>
              <button className="underline hover:text-white">خروج</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4 md:p-8">{children}</main>
    </div>
  );
}
