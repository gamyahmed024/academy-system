import { DateTime } from "luxon";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listStudents, listGuardians } from "@/server/services/people";
import { getSettings } from "@/server/services/money";
import { CURRENCIES, CURRENCY_LABELS } from "@/lib/domain/rules";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink, Field } from "@/components/ui";
import { createPaymentAction } from "../actions";

export const metadata = { title: "تسجيل دفعة" };

const METHODS = ["PayPal", "Wise", "تحويل بنكي", "InstaPay", "فودافون كاش", "كاش", "Stripe", "أخرى"];

export default async function NewPayment(props: PageProps<"/payments/new">) {
  await requireStaff();
  const sp = await props.searchParams;
  const db = getDb();
  const [students, guardians, s] = await Promise.all([listStudents(db), listGuardians(db), getSettings(db)]);
  const pre = typeof sp.student === "string" ? `s:${sp.student}` : typeof sp.guardian === "string" ? `g:${sp.guardian}` : "";
  return (
    <div className="max-w-3xl">
      <BackLink href="/payments">المدفوعات</BackLink>
      <PageHeader title="تسجيل دفعة" subtitle="سعر الصرف بيتسجل مع الدفعة، فتقارير الشهور اللي فاتت مش بتتغير لما الدولار يغلى أو يرخص" />
      <div className="card">
        <ActionForm action={createPaymentAction} submit="تسجيل الدفعة" submitClass="btn-accent">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="مين دفع؟" hint="لو العيلة هي اللي بتدفع، اختار ولي الأمر، والحصص هتتضاف لمحفظة العيلة المشتركة">
                <select name="payer" required defaultValue={pre} className="input">
                  <option value="" disabled>اختار</option>
                  <optgroup label="أولياء الأمور (عائلات)">
                    {guardians.map((g) => <option key={g.id} value={`g:${g.id}`}>عيلة {g.name}</option>)}
                  </optgroup>
                  <optgroup label="الطلاب">
                    {students.filter((x) => !x.guardianId).map((x) => <option key={x.id} value={`s:${x.id}`}>{x.name}</option>)}
                  </optgroup>
                </select>
              </Field>
            </div>
            <Field label="المبلغ"><input name="amount" inputMode="decimal" required className="input ltr text-left" placeholder="120" /></Field>
            <Field label="العملة">
              <select name="currency" defaultValue="USD" className="input">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c} · {CURRENCY_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="سعر الصرف للجنيه يوم الدفع" hint="مثلًا: الدولار بـ 48.50. سيبه فاضي لو الدفع بالجنيه">
              <input name="rateToEgp" inputMode="decimal" className="input ltr text-left" placeholder="48.50" />
            </Field>
            <Field label="عدد الحصص اللي بتتضاف للرصيد"><input name="lessonsCredited" type="number" min={0} defaultValue={8} className="input" /></Field>
            <Field label="طريقة الدفع">
              <select name="method" className="input">{METHODS.map((m) => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label="تاريخ الدفع"><input name="paidOn" type="date" required defaultValue={DateTime.now().setZone(s.academyTimezone).toISODate()!} className="input" /></Field>
            <div className="sm:col-span-2"><Field label="ملاحظة"><input name="note" className="input" /></Field></div>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
