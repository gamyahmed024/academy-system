import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { getLesson } from "@/server/services/schedule";
import { getSettings } from "@/server/services/money";
import { fmtDate, fmtTime, fmtDateTime, inZone, timezoneLabel, WEEKDAYS_AR } from "@/lib/domain/time";
import { ATTENDANCE_LABELS, type AttendanceState } from "@/lib/domain/rules";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink, Badge, StatusBadge, JoinButton, Field, whatsappLink } from "@/components/ui";
import { attendanceAction, moveLessonAction, cancelLessonAction, endSeriesAction } from "../actions";

export const metadata = { title: "الحصة" };

const STATES: AttendanceState[] = ["present", "late", "absent", "excused", "teacher_cancelled"];

export default async function LessonPage(props: PageProps<"/lessons/[id]">) {
  await requireStaff();
  const id = Number((await props.params).id);
  const db = getDb();
  const l = Number.isInteger(id) ? await getLesson(db, id) : null;
  if (!l) notFound();
  const s = await getSettings(db);
  const tz = s.academyTimezone;
  const local = inZone(l.startsAt, tz);
  const canEdit = l.status === "scheduled" && l.attendance.length === 0;
  const canRecord = l.status !== "cancelled" || l.attendance.some((a) => a.state === "teacher_cancelled");
  const studentTz = l.studentTimezone ?? null;
  const wa = l.participants.length === 1
    ? whatsappLink(
        l.participants[0].whatsapp,
        `Hi ${l.participants[0].name}! Reminder: your lesson with ${l.teacher.name} is ${fmtDate(l.startsAt, l.participants[0].timezone)} at ${fmtTime(l.startsAt, l.participants[0].timezone)} (your time).${l.joinUrl ? ` Join: ${l.joinUrl}` : ""}`,
      )
    : null;

  return (
    <div className="max-w-5xl">
      <BackLink href={`/schedule?week=${local.toISODate()}`}>الجدول</BackLink>
      <PageHeader
        title={l.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={l.status} />
            {l.originalStartsAt && <Badge tone="accent">اتنقلت من {fmtDateTime(l.originalStartsAt, tz)}</Badge>}
            {l.series && <Badge tone="brand">من سلسلة متكررة</Badge>}
            {l.free && <Badge tone="accent">تجريبية مجانية: مش بتتخصم من الرصيد</Badge>}
          </span>
        }
        actions={
          <>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline">تذكير واتساب</a>}
            {l.status !== "cancelled" && <JoinButton url={l.joinUrl} />}
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="card !p-4">
          <div className="text-sm text-slate-500">الميعاد (مصر)</div>
          <div className="font-bold">{fmtDate(l.startsAt, tz)}</div>
          <div className="text-2xl font-extrabold">{fmtTime(l.startsAt, tz)}</div>
          <div className="text-xs text-slate-500">{l.minutes} دقيقة</div>
        </div>
        <div className="card !p-4">
          <div className="text-sm text-slate-500">عند الطالب</div>
          {studentTz ? (
            <>
              <div className="font-bold">{fmtDate(l.startsAt, studentTz)}</div>
              <div className="text-2xl font-extrabold">{fmtTime(l.startsAt, studentTz)}</div>
              <div className="text-xs text-slate-500">{timezoneLabel(studentTz)}</div>
            </>
          ) : (
            <div className="text-sm">مجموعة: كل طالب بيشوفها بتوقيته</div>
          )}
        </div>
        <div className="card !p-4">
          <div className="text-sm text-slate-500">المدرس</div>
          <Link className="link text-lg" href={`/teachers/${l.teacher.id}`}>{l.teacher.name}</Link>
          <div className="ltr mt-1 truncate text-left text-xs text-slate-500">{l.joinUrl ?? "مفيش رابط حصة للمدرس"}</div>
        </div>
      </div>

      <section className="card mb-6">
        <h2 className="mb-1 font-bold">تسجيل الحضور</h2>
        <p className="mb-4 text-xs text-slate-500">
          الاعتذار قبل الحصة بـ {s.freeCancelHours} ساعة أو أكتر مبيتخصمش. الغياب من غير اعتذار بيتخصم. لو المدرس لغى الحصة متتخصمش. تقدر تعدّل التسجيل بعدين والرصيد بيتظبط لوحده.
        </p>
        {!canRecord ? (
          <p className="text-sm text-slate-500">الحصة دي ملغية: {l.cancelReason}</p>
        ) : (
          <ActionForm action={attendanceAction.bind(null, l.id)} submit="حفظ الحضور">
            <div className="space-y-4">
              {l.participants.map((p) => {
                const cur = l.attendance.find((a) => a.studentId === p.id);
                return (
                  <fieldset key={p.id} className="rounded-lg border border-slate-200 p-3">
                    <input type="hidden" name="studentId" value={p.id} />
                    <legend className="px-1 font-semibold">
                      <Link className="link" href={`/students/${p.id}`}>{p.name}</Link>
                      {cur && <span className="mr-2 text-xs font-normal text-slate-500">({ATTENDANCE_LABELS[cur.state]}{cur.deducted ? "، اتخصمت" : "، متخصمتش"})</span>}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {STATES.map((st) => (
                        <label key={st} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                          <input type="radio" name={`state_${p.id}`} value={st} defaultChecked={cur?.state === st} /> {ATTENDANCE_LABELS[st]}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="لو اعتذر: امتى قال؟ (بتوقيت مصر)">
                        <input
                          type="datetime-local"
                          name={`notice_${p.id}`}
                          defaultValue={cur?.noticeAt ? inZone(cur.noticeAt, tz).toFormat("yyyy-MM-dd'T'HH:mm") : ""}
                          className="input"
                        />
                      </Field>
                      <Field label="ملاحظة المدرس / الواجب">
                        <input name={`note_${p.id}`} defaultValue={cur?.note ?? ""} className="input" />
                      </Field>
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </ActionForm>
        )}
      </section>

      {canEdit && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card">
            <h2 className="mb-1 font-bold">نقل الحصة دي بس</h2>
            <p className="mb-3 text-xs text-slate-500">باقي مواعيد السلسلة مش هتتأثر.</p>
            <ActionForm action={moveLessonAction.bind(null, l.id)} submit="نقل" submitClass="btn-outline">
              <input type="hidden" name="tz" value={tz} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="التاريخ (مصر)"><input type="date" name="date" required defaultValue={local.toISODate()!} className="input" /></Field>
                <Field label="الساعة (مصر)"><input type="time" name="time" required defaultValue={local.toFormat("HH:mm")} className="input" /></Field>
                <div className="sm:col-span-2"><Field label="السبب"><input name="reason" className="input" placeholder="مثلًا: طلب الطالب" /></Field></div>
              </div>
            </ActionForm>
          </section>
          <section className="card">
            <h2 className="mb-1 font-bold">إلغاء الحصة</h2>
            <p className="mb-3 text-xs text-slate-500">إلغاء من الأكاديمية: مش هتتخصم من الطالب. لو الطالب هو اللي اعتذر سجّلها في الحضور كـ &quot;اعتذر&quot;.</p>
            <ActionForm action={cancelLessonAction.bind(null, l.id)} submit="إلغاء الحصة" submitClass="btn-danger" confirm="متأكد إنك عايز تلغي الحصة؟">
              <Field label="السبب"><input name="reason" required className="input" /></Field>
            </ActionForm>
            {l.series && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="mb-1 text-sm font-bold">إنهاء السلسلة</h3>
                <p className="mb-2 text-xs text-slate-500">
                  {l.series.weekdays.map((d) => WEEKDAYS_AR[d]).join(" و")} الساعة {l.series.localTime} ({timezoneLabel(l.series.anchorTimezone)})، لحد {l.series.endDate}. ده هيلغي كل الحصص الجاية من الحصة دي وبعدها.
                </p>
                <ActionForm action={endSeriesAction.bind(null, l.series.id, l.id)} submit="إنهاء السلسلة من هنا" submitClass="btn-danger btn-sm" confirm="هيتلغي كل الحصص الجاية في السلسلة. متأكد؟">
                  <input type="hidden" name="from" value={l.startsAt.toISOString()} />
                </ActionForm>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
