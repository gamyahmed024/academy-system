import Link from "next/link";
import { Logo } from "@/components/logo";
import { nameFor } from "@/lib/academy-name";
import { getDb } from "@/db";
import { getSettings } from "@/server/services/money";
import { getT } from "@/server/lang";
import { ActionForm } from "@/components/action-form";
import { LangSwitch } from "@/components/lang-switch";
import { forgotPassword } from "../actions";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("forgotTitle") };
}

/** "Forgot password": a request the academy answers with a new temporary password. */
export default async function ForgotPage() {
  const s = await getSettings(getDb());
  const { lang, t } = await getT();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand to-brand-dark p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 text-center">
          <Logo size={56} className="mx-auto mb-3" />
          <h1 className="text-xl font-extrabold">{t("forgotTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{t("forgotText")}</p>
        </div>
        <ActionForm action={forgotPassword} submit={t("forgotSend")} submitClass="btn w-full" pendingLabel={t("pending")} resetOnSuccess>
          <label className="block">
            <span className="label">{t("email")}</span>
            <input name="email" type="email" required autoComplete="email" className="input ltr text-left" />
          </label>
        </ActionForm>
        <Link href="/login" className="link mt-4 block text-center text-sm">
          {t("backToLogin")}
        </Link>
      </div>
      <p className="text-sm text-white/70">{nameFor(s, lang)}</p>
      <LangSwitch current={lang} label={t("language")} className="text-white" />
    </main>
  );
}
