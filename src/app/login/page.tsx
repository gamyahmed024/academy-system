import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/server/session";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { ActionForm } from "@/components/action-form";
import { login } from "./actions";

export const metadata = { title: "تسجيل الدخول" };

export default async function LoginPage(props: PageProps<"/login">) {
  const changed = (await props.searchParams).changed === "1";
  const me = await getCurrentUser();
  if (me) redirect(homeFor(me.role));
  const s = await getSettings(getDb());
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand to-brand-dark p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-extrabold text-white">
            {s.academyName.slice(0, 1)}
          </div>
          <h1 className="text-xl font-extrabold">{s.academyName}</h1>
          <p className="text-sm text-slate-500">سجّل دخولك علشان تكمل</p>
        </div>
        {changed && <p className="mb-4 rounded-lg bg-brand-soft p-3 text-center text-sm font-semibold text-brand">اتغيرت كلمة السر. ادخل بالجديدة.</p>}
        <ActionForm action={login} submit="دخول" submitClass="btn w-full">
          <div className="space-y-4">
            <label className="block">
              <span className="label">الإيميل</span>
              <input name="email" type="email" required autoComplete="email" className="input ltr text-left" />
            </label>
            <label className="block">
              <span className="label">كلمة السر</span>
              <input name="password" type="password" required autoComplete="current-password" className="input ltr text-left" />
            </label>
          </div>
        </ActionForm>
      </div>
    </main>
  );
}
