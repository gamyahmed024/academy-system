import { requirePortal } from "@/server/session";
import { getT } from "@/server/lang";
import { dirOf } from "@/lib/i18n";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink } from "@/components/ui";
import { changeMyPasswordAction } from "../actions";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("changePasswordTitle") };
}

export default async function MyPassword() {
  await requirePortal();
  const { lang, t } = await getT();
  return (
    <div className="max-w-md">
      <BackLink href="/my" ltr={dirOf(lang) === "ltr"}>{t("home")}</BackLink>
      <PageHeader title={t("changePasswordTitle")} subtitle={t("changePasswordSubtitle")} />
      <div className="card">
        <ActionForm action={changeMyPasswordAction} submit={t("changeButton")} pendingLabel={t("pending")}>
          <div className="space-y-4">
            <label className="block"><span className="label">{t("currentPassword")}</span><input name="current" type="password" required className="input ltr" autoComplete="current-password" /></label>
            <label className="block"><span className="label">{t("newPassword")}</span><input name="next" type="password" required minLength={8} className="input ltr" autoComplete="new-password" /></label>
            <label className="block"><span className="label">{t("confirmPassword")}</span><input name="confirm" type="password" required minLength={8} className="input ltr" autoComplete="new-password" /></label>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
