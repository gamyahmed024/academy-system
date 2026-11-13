import { Field, STATUS_OPTIONS } from "@/components/ui";
import { TimezoneSelect } from "@/components/tz-select";

type S = {
  name?: string; email?: string | null; whatsapp?: string | null; country?: string | null;
  nativeLanguage?: string | null; timezone?: string; subject?: string | null; level?: string | null; meetingUrl?: string | null;
  status?: string; guardianId?: number | null; notes?: string | null;
};

export function StudentFields({ s = {}, guardians }: { s?: S; guardians: { id: number; name: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="الاسم"><input name="name" required defaultValue={s.name} className="input" /></Field>
      <Field label="الحالة">
        <select name="status" defaultValue={s.status ?? "active"} className="input">
          {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <Field label="الإيميل"><input name="email" type="email" defaultValue={s.email ?? ""} className="input ltr text-left" /></Field>
      <Field label="الواتساب" hint="بكود الدولة، مثلًا +49 151 2345678">
        <input name="whatsapp" defaultValue={s.whatsapp ?? ""} className="input ltr text-left" />
      </Field>
      <Field label="البلد"><input name="country" defaultValue={s.country ?? ""} className="input" /></Field>
      <Field label="اللغة الأم"><input name="nativeLanguage" defaultValue={s.nativeLanguage ?? ""} className="input" /></Field>
      <Field label="المنطقة الزمنية" hint="مواعيد الطالب بتتثبت على توقيته">
        <TimezoneSelect defaultValue={s.timezone} />
      </Field>
      <Field label="ولي الأمر (للعائلات)" hint="لو اخترت ولي أمر، الطالب هيستخدم محفظة العيلة المشتركة">
        <select name="guardianId" defaultValue={s.guardianId ?? ""} className="input">
          <option value="">بدون</option>
          {guardians.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </Field>
      <Field label="المادة"><input name="subject" defaultValue={s.subject ?? ""} placeholder="عامية مصرية، فصحى، قرآن…" className="input" /></Field>
      <Field label="المستوى"><input name="level" defaultValue={s.level ?? ""} placeholder="مبتدئ، متوسط، متقدم" className="input" /></Field>
      <div className="sm:col-span-2">
        <Field label="رابط حصص الطالب (اختياري)" hint="رابط Meet أو Zoom خاص بالطالب ده يعمله المدرس. لو موجود، الطالب والمدرس بيدخلوا عليه في حصصه الفردية بدل رابط المدرس العام.">
          <input name="meetingUrl" type="url" placeholder="https://meet.google.com/xxx-xxxx-xxx" defaultValue={s.meetingUrl ?? ""} className="input ltr text-left" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="ملاحظات"><textarea name="notes" defaultValue={s.notes ?? ""} rows={3} className="input" /></Field>
      </div>
    </div>
  );
}
