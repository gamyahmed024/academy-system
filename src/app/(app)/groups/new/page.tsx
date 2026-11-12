import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listTeachers, listStudents } from "@/server/services/people";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink, Field } from "@/components/ui";
import { createGroupAction } from "../actions";

export const metadata = { title: "مجموعة جديدة" };

export default async function NewGroup() {
  await requireStaff();
  const db = getDb();
  const [teachers, students] = await Promise.all([listTeachers(db), listStudents(db)]);
  return (
    <div className="max-w-3xl">
      <BackLink href="/groups">المجموعات</BackLink>
      <PageHeader title="مجموعة جديدة" />
      <div className="card">
        <ActionForm action={createGroupAction} submit="إنشاء المجموعة">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المجموعة"><input name="name" required className="input" /></Field>
            <Field label="المستوى"><input name="level" className="input" /></Field>
            <Field label="المدرس">
              <select name="teacherId" required className="input">
                {teachers.filter((t) => t.status !== "stopped").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>
          <fieldset className="mt-4">
            <legend className="label">الطلاب</legend>
            <div className="grid max-h-72 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
              {students.filter((s) => s.status !== "stopped").map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="studentIds" value={s.id} /> {s.name}
                </label>
              ))}
            </div>
          </fieldset>
        </ActionForm>
      </div>
    </div>
  );
}
