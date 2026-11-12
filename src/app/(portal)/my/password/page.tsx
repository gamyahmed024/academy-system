import { requirePortal } from "@/server/session";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink } from "@/components/ui";
import { changeMyPasswordAction } from "../actions";

export const metadata = { title: "كلمة السر" };

export default async function MyPassword() {
  await requirePortal();
  return (
    <div className="max-w-md">
      <BackLink href="/my">الرئيسية</BackLink>
      <PageHeader title="تغيير كلمة السر" subtitle="بعد التغيير هتدخل تاني بكلمة السر الجديدة" />
      <div className="card">
        <ActionForm action={changeMyPasswordAction} submit="غيّر">
          <div className="space-y-4">
            <label className="block"><span className="label">كلمة السر الحالية</span><input name="current" type="password" required className="input ltr" autoComplete="current-password" /></label>
            <label className="block"><span className="label">كلمة السر الجديدة (8 حروف على الأقل)</span><input name="next" type="password" required minLength={8} className="input ltr" autoComplete="new-password" /></label>
            <label className="block"><span className="label">اكتبها تاني</span><input name="confirm" type="password" required minLength={8} className="input ltr" autoComplete="new-password" /></label>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
