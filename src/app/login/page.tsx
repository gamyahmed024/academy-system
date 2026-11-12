import { Logo } from "@/components/logo";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/server/session";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { getT } from "@/server/lang";
import { ActionForm } from "@/components/action-form";
import { LangSwitch } from "@/components/lang-switch";
import { login } from "./actions";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("loginButton") };
}

export default async function LoginPage(props: PageProps<"/login">) {
  const changed = (await props.searchParams).changed === "1";
  const me = await getCurrentUser();
  if (me) redirect(homeFor(me.role));
  const s = await getSettings(getDb());
  const { lang, t } = await getT();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand to-brand-dark p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <Logo size={72} className="mx-auto mb-3" />
          <h1 className="text-xl font-extrabold">{s.academyName}</h1>
          <p className="text-sm text-slate-500">{t("loginSubtitle")}</p>
        </div>
        {changed && <p className="mb-4 rounded-lg bg-brand-soft p-3 text-center text-sm font-semibold text-brand">{t("passwordChanged")}</p>}
        <ActionForm action={login} submit={t("loginButton")} submitClass="btn w-full" pendingLabel={t("pending")}>
          <div className="space-y-4">
            <label className="block">
              <span className="label">{t("email")}</span>
              <input name="email" type="email" required autoComplete="email" className="input ltr text-left" />
            </label>
            <label className="block">
              <span className="label">{t("password")}</span>
              <input name="password" type="password" required autoComplete="current-password" className="input ltr text-left" />
            </label>
          </div>
        </ActionForm>
      </div>
      <LangSwitch current={lang} label={t("language")} className="text-white" />
    </main>
  );
}
