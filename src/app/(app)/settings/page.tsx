import { inArray, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/server/session";
import { getSettings } from "@/server/services/money";
import { ActionForm } from "@/components/action-form";
import { PageHeader, Field, Badge } from "@/components/ui";
import { settingsAction, addStaffAction, changePasswordAction } from "./actions";

export const metadata = { title: "الإعدادات" };

export default async function Settings() {
  await requireAdmin();
  const db = getDb();
  const [s, staff] = await Promise.all([
    getSettings(db),
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
            <Field label="الاعتذار المجاني قبل الحصة بكام ساعة؟"><input name="freeCancelHours" type="number" min={0} max={168} defaultValue={s.freeCancelHours} className="input" /></Field>
            <Field label="المدرس ياخد أجر الحصة لو الطالب غاب من غير اعتذار؟">
              <select name="payTeacherOnNoShow" defaultValue={s.payTeacherOnNoShow ? "1" : "0"} className="input">
                <option value="1">أيوه</option>
                <option value="0">لأ</option>
              </select>
            </Field>
            <Field label="نبّهني لما رصيد الطالب يوصل لـ"><input name="lowBalanceThreshold" type="number" min={0} max={10} defaultValue={s.lowBalanceThreshold} className="input" /></Field>
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
    </div>
  );
}
