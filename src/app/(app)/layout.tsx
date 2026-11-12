import { requireStaff } from "@/server/session";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { Nav } from "@/components/nav";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireStaff();
  const s = await getSettings(getDb());
  return (
    // staff pages are always Arabic, whatever language the browser picked
    <div lang="ar" dir="rtl" className="min-h-screen md:flex">
      <aside className="relative bg-sidebar p-3 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:p-4">
        <div className="mb-3 flex items-center justify-between md:mb-6 md:block">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-extrabold text-white">
              {s.academyName.slice(0, 1)}
            </span>
            <span className="font-extrabold text-white">{s.academyName}</span>
          </div>
        </div>
        <Nav isAdmin={user.role === "admin"} />
        <div className="mt-4 border-t border-white/10 pt-4 text-sm text-sidebar-text md:absolute md:bottom-4 md:w-48">
          <div className="font-semibold text-white">{user.name}</div>
          <div className="text-xs">{user.role === "admin" ? "الإدارة" : "سكرتارية"}</div>
          <a href="/welcome" target="_blank" rel="noopener" className="mt-2 block text-xs underline hover:text-white">
            عرض الصفحة الرئيسية للزوار ↗
          </a>
          <form action={logout}>
            <button className="mt-2 text-xs underline hover:text-white">تسجيل الخروج</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
