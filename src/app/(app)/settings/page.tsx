import { inArray, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/server/session";
import { getSettings } from "@/server/services/money";
import { ActionForm } from "@/components/action-form";
import { PageHeader, Field, Badge } from "@/components/ui";
import { settingsAction, addStaffAction, changePasswordAction, addPlanAction, removePlanAction, wipeTrialDataAction } from "./actions";
import { WIPE_CONFIRM_WORD } from "@/server/services/cleanup";
import { listPricePlans } from "@/server/services/requests";
import { CURRENCIES, fmtMoney } from "@/lib/domain/rules";

export const metadata = { title: "الإعدادات" };

export default async function Settings() {
  await requireAdmin();
  const db = getDb();
  const [s, plans, staff] = await Promise.all([
    getSettings(db),
    listPricePlans(db),
    db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(inArray(users.role, ["admin", "staff"])).orderBy(asc(users.id)),
  ]);
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="الإعدادات" />
      <section className="card">
        <h2 className="mb-4 font-bold">الأكاديمية وقواعد الحضور</h2>
        <ActionForm action={settingsAction}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الأكاديمية" hint="بيظهر في القائمة والإيصالات. الألوان بتتغير من ملف واحد في الكود."><input name="academyName" defaultValue={s.academyName} className="input" /></Field>
            <Field label="الاسم بالحروف اللاتينية" hint="بيظهر للزوار والطلاب اللي صفحتهم مش بالعربي، لأنهم مش هيعرفوا يقروا الاسم العربي."><input name="academyNameLatin" defaultValue={s.academyNameLatin} className="input ltr text-left" /></Field>
            <Field label="الاعتذار المجاني قبل الحصة بكام ساعة؟"><input name="freeCancelHours" type="number" min={0} max={168} defaultValue={s.freeCancelHours} className="input" /></Field>
            <Field label="المدرس ياخد أجر الحصة لو الطالب غاب من غير اعتذار؟">
              <select name="payTeacherOnNoShow" defaultValue={s.payTeacherOnNoShow ? "1" : "0"} className="input">
                <option value="1">أيوه</option>
                <option value="0">لأ</option>
              </select>
            </Field>
            <Field label="أجر المدرس في الحصة التجريبية (جنيه)" hint="الحصة التجريبية مجانية للطالب، والمدرس بياخد المبلغ ده عليها بدل أجره العادي."><input name="trialPayEgp" inputMode="decimal" defaultValue={s.trialPayEgp} className="input ltr text-left" /></Field>
            <Field label="نبّهني لما رصيد الطالب يوصل لـ"><input name="lowBalanceThreshold" type="number" min={0} max={10} defaultValue={s.lowBalanceThreshold} className="input" /></Field>
            <Field label="واتساب الأكاديمية" hint="بكود الدولة، مثلًا +201001234567. بيظهر كزرار تواصل في الصفحة الرئيسية للزوار، ولو سبته فاضي الزرار مش هيظهر."><input name="contactWhatsapp" defaultValue={s.contactWhatsapp ?? ""} className="input ltr text-left" inputMode="tel" /></Field>
          </div>
        </ActionForm>
      </section>

      <section className="card">
        <h2 className="mb-1 font-bold">الأسعار في الصفحة الرئيسية</h2>
        <p className="mb-4 text-sm text-slate-500">كل باقة بتظهر للزوار بلغتهم (مثلًا «8 حصص في الشهر · 45 دقيقة»)، ومعاها سعر الحصة الواحدة. لو مفيش باقات، قسم الأسعار مش هيظهر.</p>
        {plans.length > 0 && (
          <ul className="mb-4 divide-y divide-slate-100 text-sm">
            {plans.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  {p.lessonsPerMonth} حصة في الشهر · {p.minutes} دقيقة · <b>{fmtMoney(p.price, p.currency)}</b>
                  {p.featured && <Badge tone="accent">الأكثر طلبًا</Badge>}
                </span>
                <form action={removePlanAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn-danger btn-sm">شيلها</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <ActionForm action={addPlanAction} submit="إضافة باقة" submitClass="btn-outline" resetOnSuccess>
          <div className="grid gap-3 sm:grid-cols-5">
            <Field label="حصص في الشهر"><input name="lessonsPerMonth" type="number" min={1} max={60} required className="input" /></Field>
            <Field label="مدة الحصة (دقيقة)"><input name="minutes" type="number" min={15} max={240} step={5} defaultValue={45} required className="input" /></Field>
            <Field label="السعر في الشهر"><input name="price" type="number" min={1} step="0.01" required className="input" /></Field>
            <Field label="العملة">
              <select name="currency" defaultValue="USD" className="input">{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="مميزة؟">
              <select name="featured" defaultValue="0" className="input"><option value="0">لأ</option><option value="1">الأكثر طلبًا</option></select>
            </Field>
          </div>
        </ActionForm>
      </section>

      <section className="card">
        <h2 className="mb-4 font-bold">المستخدمين (الإدارة والسكرتارية)</h2>
        <ul className="mb-4 divide-y divide-slate-100 text-sm">
          {staff.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2">
              <span>{u.name} · <span className="ltr text-slate-500">{u.email}</span></span>
              <Badge tone={u.role === "admin" ? "brand" : "gray"}>{u.role === "admin" ? "إدارة" : "سكرتارية"}</Badge>
            </li>
          ))}
        </ul>
        <ActionForm action={addStaffAction} submit="إضافة مستخدم" submitClass="btn-outline" resetOnSuccess>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="الاسم"><input name="name" required className="input" /></Field>
            <Field label="الإيميل"><input name="email" type="email" required className="input ltr text-left" /></Field>
            <Field label="كلمة سر مؤقتة"><input name="password" type="text" required minLength={8} className="input ltr text-left" /></Field>
            <Field label="الصلاحية">
              <select name="role" className="input"><option value="staff">سكرتارية</option><option value="admin">إدارة</option></select>
            </Field>
          </div>
        </ActionForm>
        <p className="mt-2 text-xs text-slate-500">السكرتارية بتقدر تدير الطلاب والحصص والحضور وتسجل المدفوعات، لكن مبتشوفش التقارير المالية ولا الإعدادات.</p>
      </section>

      <section className="card">
        <h2 className="mb-4 font-bold">تغيير كلمة السر</h2>
        <ActionForm action={changePasswordAction} submit="تغيير" submitClass="btn-outline" resetOnSuccess>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="الحالية"><input name="current" type="password" required className="input" /></Field>
            <Field label="الجديدة"><input name="next" type="password" required minLength={8} className="input" /></Field>
            <Field label="تأكيد الجديدة"><input name="confirm" type="password" required className="input" /></Field>
          </div>
        </ActionForm>
      </section>

      <section className="card border-red-200">
        <h2 className="mb-1 font-bold text-red-700">مسح كل بيانات التجربة</h2>
        <p className="mb-2 text-sm text-slate-600">
          لما تخلّص تجربة وعايز تبدأ بالطلاب الحقيقيين: الزرار ده بيمسح <b>كل</b> الطلاب والعائلات والمدرسين والحصص والحضور والمدفوعات ومستحقات المدرسين وطلبات الحصص التجريبية، وحسابات الطلاب والمدرسين وأولياء الأمور على الموقع.
        </p>
        <p className="mb-4 text-sm text-slate-600">اللي بيفضل: حسابات الإدارة والسكرتارية، والإعدادات اللي فوق، وباقات الأسعار. مينفعش ترجّع اللي اتمسح.</p>
        <ActionForm
          action={wipeTrialDataAction}
          submit="امسح كل بيانات التجربة"
          submitClass="btn-danger"
          confirm="آخر تأكيد: كل الطلاب والمدرسين والحصص والمدفوعات هتتمسح نهائيًا. متأكد؟"
          pendingLabel="بيتمسح…"
          resetOnSuccess
        >
          <Field label={`علشان تأكد، اكتب كلمة «${WIPE_CONFIRM_WORD}» هنا`}>
            <input name="confirmWord" required autoComplete="off" className="input max-w-xs" />
          </Field>
        </ActionForm>
      </section>
    </div>
  );
}
