import Link from "next/link";
import { DateTime } from "luxon";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listTeachers, listStudents, listGroups } from "@/server/services/people";
import { getSettings } from "@/server/services/money";
import { WEEK_ORDER, WEEKDAYS_AR } from "@/lib/domain/time";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink, Field } from "@/components/ui";
import { createLessonAction } from "../actions";

export const metadata = { title: "حصة جديدة" };

export default async function NewLesson(props: PageProps<"/lessons/new">) {
  await requireStaff();
  const sp = await props.searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const mode = one("mode") === "series" ? "series" : "single";
  const db = getDb();
  const [teachers, students, groups, s] = await Promise.all([listTeachers(db), listStudents(db), listGroups(db), getSettings(db)]);
  const today = DateTime.now().setZone(s.academyTimezone);
  // A student still on trial gets a free 30-minute trial lesson by default.
  const pre = students.find((x) => String(x.id) === one("student"));
  const trial = mode === "single" && pre?.status === "trial";
  const qs = (m: string) => `/lessons/new?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => typeof v === "string")) as Record<string, string>, mode: m })}`;

  return (
    <div className="max-w-3xl">
      <BackLink href="/schedule">الجدول</BackLink>
      <PageHeader title="حصة جديدة" />
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm font-semibold">
        <Link href={qs("single")} className={`rounded-md px-4 py-1.5 ${mode === "single" ? "bg-brand text-white" : "text-slate-600"}`}>حصة واحدة</Link>
        <Link href={qs("series")} className={`rounded-md px-4 py-1.5 ${mode === "series" ? "bg-brand text-white" : "text-slate-600"}`}>حصص متكررة كل أسبوع</Link>
      </div>
      <div className="card">
        <ActionForm action={createLessonAction} submit={mode === "series" ? "إنشاء الحصص" : "إنشاء الحصة"}>
          <input type="hidden" name="mode" value={mode} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="المدرس">
              <select name="teacherId" required defaultValue={one("teacher")} className="input">
                <option value="" disabled>اختار</option>
                {teachers.filter((t) => t.status !== "stopped").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="المدة (بالدقيقة)"><input name="minutes" type="number" min={15} max={240} step={5} defaultValue={trial ? 30 : 60} className="input" /></Field>
            <Field label="الطالب" hint="اختار طالب أو مجموعة">
              <select name="studentId" defaultValue={one("student")} className="input">
                <option value="">—</option>
                {students.filter((x) => x.status !== "stopped").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Field>
            <Field label="أو المجموعة">
              <select name="groupId" defaultValue={one("group")} className="input">
                <option value="">—</option>
                {groups.filter((g) => g.active).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </Field>
            <Field label="الوقت مكتوب بتوقيت" hint="الأفضل توقيت الطالب علشان ميعاده يفضل ثابت طول السنة">
              <select name="anchor" defaultValue="student" className="input">
                <option value="student">توقيت الطالب</option>
                <option value="academy">توقيت مصر</option>
              </select>
            </Field>
            <Field label="الساعة"><input name="time" type="time" required defaultValue="18:00" className="input" /></Field>

            {mode === "single" ? (
              <>
                <Field label="التاريخ"><input name="date" type="date" required defaultValue={today.toISODate()!} className="input" /></Field>
                <Field label="الموضوع (اختياري)"><input name="topic" defaultValue={trial ? "حصة تجريبية" : ""} className="input" /></Field>
                <label className="flex items-center gap-2 rounded-lg bg-accent-soft p-3 text-sm font-semibold sm:col-span-2">
                  <input type="checkbox" name="free" value="1" defaultChecked={trial} />
                  حصة تجريبية مجانية: مش هتتخصم من رصيد الطالب لو حضر (والمدرس بياخد عليها أجر الحصة التجريبية اللي في الإعدادات)
                </label>
              </>
            ) : (
              <>
                <div className="sm:col-span-2">
                  <span className="label">الأيام</span>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_ORDER.map((d) => (
                      <label key={d} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                        <input type="checkbox" name="weekdays" value={d} /> {WEEKDAYS_AR[d]}
                      </label>
                    ))}
                  </div>
                </div>
                <Field label="من تاريخ"><input name="startDate" type="date" required defaultValue={today.toISODate()!} className="input" /></Field>
                <Field label="لحد تاريخ" hint="بعدها تقدر تمد السلسلة"><input name="endDate" type="date" required defaultValue={today.plus({ months: 3 }).toISODate()!} className="input" /></Field>
              </>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-500">النظام هيرفض أي حصة بتتعارض مع حصة تانية للمدرس أو للطالب. رابط الحصة هو رابط المدرس الثابت.</p>
        </ActionForm>
      </div>
    </div>
  );
}
