import { Logo } from "@/components/logo";
import Link from "next/link";
import { requirePortal } from "@/server/session";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { getT } from "@/server/lang";
import { LangSwitch } from "@/components/lang-switch";
import { logout } from "../login/actions";

const ROLE_KEY = { teacher: "roleTeacher", student: "roleStudent", guardian: "roleGuardian" } as const;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePortal();
  const s = await getSettings(getDb());
  const { lang, t } = await getT();
  return (
    <div className="min-h-screen">
      <header className="bg-sidebar text-sidebar-text">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/my" className="flex items-center gap-2">
            <Logo size={38} />
            <span className="font-extrabold text-white">{s.academyName}</span>
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span>
              <span className="font-semibold text-white">{user.name}</span> · {t(ROLE_KEY[user.role as keyof typeof ROLE_KEY])}
            </span>
            <LangSwitch current={lang} label={t("language")} />
            <Link href="/my/password" className="underline hover:text-white">{t("passwordLink")}</Link>
            <form action={logout}>
              <button className="underline hover:text-white">{t("logout")}</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4 md:p-8">{children}</main>
    </div>
  );
}
