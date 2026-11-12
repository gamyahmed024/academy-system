import { Field } from "@/components/ui";
import { TimezoneSelect } from "@/components/tz-select";

type G = { name?: string; email?: string | null; whatsapp?: string | null; timezone?: string; notes?: string | null };

export function GuardianFields({ g = {} }: { g?: G }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="اسم ولي الأمر"><input name="name" required defaultValue={g.name} className="input" /></Field>
      <Field label="المنطقة الزمنية"><TimezoneSelect defaultValue={g.timezone} /></Field>
      <Field label="الإيميل"><input name="email" type="email" defaultValue={g.email ?? ""} className="input ltr text-left" /></Field>
      <Field label="الواتساب"><input name="whatsapp" defaultValue={g.whatsapp ?? ""} className="input ltr text-left" /></Field>
      <div className="sm:col-span-2"><Field label="ملاحظات"><textarea name="notes" rows={2} defaultValue={g.notes ?? ""} className="input" /></Field></div>
    </div>
  );
}
