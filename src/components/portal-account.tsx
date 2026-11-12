import { getDb } from "@/db";
import { portalAccount, type PortalKind } from "@/server/services/portal";
import { createAccountAction, resetPasswordAction, toggleAccountAction } from "@/app/(app)/portal-actions";
import { ActionForm } from "./action-form";
import { Badge } from "./ui";

const WHO: Record<PortalKind, string> = {
  teacher: "يشوف حصصه ويسجل الحضور ويتابع مستحقاته",
  student: "يشوف مواعيده بتوقيته ويدخل الحصة ويعتذر ويشوف رصيده",
  guardian: "يشوف مواعيد أولاده ورصيد العيلة والمدفوعات ويعتذر عن حصة",
};

/** Staff card on a teacher / student / guardian page to manage their login. */
export async function PortalAccountCard({ kind, id, defaultEmail }: { kind: PortalKind; id: number; defaultEmail: string | null }) {
  const acc = await portalAccount(getDb(), kind, id);
  return (
    <section className="card">
      <h2 className="mb-1 font-bold">حساب الدخول</h2>
      <p className="mb-3 text-xs text-slate-500">بالحساب ده {WHO[kind]}.</p>
      {!acc ? (
        <ActionForm action={createAccountAction.bind(null, kind, id)} submit="اعمل حساب" submitClass="btn-outline">
          <label className="block">
            <span className="label">الإيميل اللي هيدخل بيه</span>
            <input name="email" type="email" required defaultValue={defaultEmail ?? ""} className="input ltr text-left" />
          </label>
          <p className="mt-2 text-xs text-slate-500">النظام هيعمل كلمة سر مؤقتة ويوريهالك مرة واحدة علشان تبعتها.</p>
        </ActionForm>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="ltr font-semibold">{acc.email}</span>
            {acc.active ? <Badge tone="green">شغال</Badge> : <Badge tone="red">متوقف</Badge>}
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionForm action={resetPasswordAction.bind(null, kind, id, acc.email)} submit="كلمة سر جديدة" submitClass="btn-outline btn-sm" confirm="هتتعمل كلمة سر جديدة والقديمة هتبطل. تكمل؟">{null}</ActionForm>
            <ActionForm
              action={toggleAccountAction.bind(null, kind, id, !acc.active)}
              submit={acc.active ? "وقف الحساب" : "فعّل الحساب"}
              submitClass={acc.active ? "btn-danger btn-sm" : "btn btn-sm"}
            >{null}</ActionForm>
          </div>
        </div>
      )}
    </section>
  );
}
