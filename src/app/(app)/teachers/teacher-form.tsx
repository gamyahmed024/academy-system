import { Field, STATUS_OPTIONS } from "@/components/ui";
import { TimezoneSelect } from "@/components/tz-select";

type T = {
  name?: string; email?: string | null; whatsapp?: string | null; timezone?: string; subjects?: string | null;
  meetingUrl?: string | null; payPerLessonEgp?: string; status?: string;
};

export function TeacherFields({ t = {} }: { t?: T }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="الاسم"><input name="name" required defaultValue={t.name} className="input" /></Field>
      <Field label="الحالة">
        <select name="status" defaultValue={t.status ?? "active"} className="input">
          {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="رابط الحصة الثابت (Google Meet أو Zoom)" hint="بيتحط مرة واحدة، والنظام بيعرضه للطالب في كل حصة مع المدرس ده">
          <input name="meetingUrl" type="url" placeholder="https://meet.google.com/xxx-xxxx-xxx" defaultValue={t.meetingUrl ?? ""} className="input ltr text-left" />
        </Field>
      </div>
      <Field label="أجر الحصة (جنيه)"><input name="payPerLessonEgp" inputMode="decimal" defaultValue={t.payPerLessonEgp ?? ""} className="input ltr text-left" /></Field>
      <Field label="المنطقة الزمنية"><TimezoneSelect defaultValue={t.timezone} /></Field>
      <Field label="الإيميل"><input name="email" type="email" defaultValue={t.email ?? ""} className="input ltr text-left" /></Field>
      <Field label="الواتساب"><input name="whatsapp" defaultValue={t.whatsapp ?? ""} className="input ltr text-left" /></Field>
      <div className="sm:col-span-2"><Field label="المواد"><input name="subjects" defaultValue={t.subjects ?? ""} className="input" /></Field></div>
    </div>
  );
}
