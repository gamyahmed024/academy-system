import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { payouts } from "@/db/schema";
import { requireStaff } from "@/server/session";
import { getTeacher } from "@/server/services/people";
import { listLessons } from "@/server/services/schedule";
import { getSettings, teacherMonthLessons, teacherMonthPay } from "@/server/services/money";
import { fmtMoney } from "@/lib/domain/rules";
import { fmtDate, fmtTime, monthKey, inZone } from "@/lib/domain/time";
import { ActionForm } from "@/components/action-form";
import { PortalAccountCard } from "@/components/portal-account";
import { PageHeader, BackLink, Kpi, Empty, Badge, JoinButton } from "@/components/ui";
import { TeacherFields } from "../teacher-form";
import { updateTeacherAction, closeMonthAction, markPaidAction, deleteTeacherAction } from "../actions";
import { teacherFootprint } from "@/server/services/cleanup";
import { DeleteCard } from "@/components/delete-card";

export const metadata = { title: "المدرس" };

export default async function TeacherPage(props: PageProps<"/teachers/[id]">) {
  const user = await requireStaff();
  const id = Number((await props.params).id);
  const db = getDb();
  const t = Number.isInteger(id) ? await getTeacher(db, id) : null;
  if (!t) notFound();
  const s = await getSettings(db);
  const tz = s.academyTimezone;
  const now = new Date();
  const thisMonth = monthKey(now, tz);
  const lastMonth = inZone(now, tz).minus({ months: 1 }).toFormat("yyyy-MM");
  const [upcoming, nThis, nLast, closed] = await Promise.all([
    listLessons(db, { from: now, to: new Date(now.getTime() + 7 * 86_400_000), teacherId: id }),
    teacherMonthPay(db, t, thisMonth, s),
    teacherMonthLessons(db, id, lastMonth, tz),
    db.select().from(payouts).where(eq(payouts.teacherId, id)).orderBy(desc(payouts.month)),
  ]);
  const isAdmin = user.role === "admin";
  const lastClosed = closed.some((p) => p.month === lastMonth);

  return (
    <div>
      <BackLink href="/teachers">المدرسين</BackLink>
      <PageHeader title={t.name} subtitle={t.subjects ?? undefined} actions={<Link href={`/lessons/new?teacher=${t.id}`} className="btn">+ حصة</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="حصص الشهر ده" value={nThis.trialLessons ? `${nThis.lessons} (منها ${nThis.trialLessons} تجريبية)` : nThis.lessons} />
        <Kpi label="مستحقات الشهر ده" value={fmtMoney(nThis.amountEgp)} />
        <Kpi label="حصص الشهر اللي فات" value={nLast} />
        <Kpi label="حصص الأسبوع الجاي" value={upcoming.length} />
      </div>
      {!t.meetingUrl && <div className="mb-6 rounded-lg bg-accent-soft p-3 text-sm text-accent">المدرس ده لسه ملوش رابط حصة ثابت. ضيفه تحت علشان يظهر للطلاب.</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-bold">الأسبوع الجاي</h2>
          {upcoming.length === 0 ? <Empty>مفيش حصص.</Empty> : (
            <table className="table">
              <tbody>
                {upcoming.map((l) => (
                  <tr key={l.id}>
                    <td><Link className="link" href={`/lessons/${l.id}`}>{fmtDate(l.startsAt, tz)} · {fmtTime(l.startsAt, tz)}</Link></td>
                    <td>{l.title}</td>
                    <td className="text-left"><JoinButton url={l.joinUrl} small /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {isAdmin && (
          <section className="card">
            <h2 className="mb-1 font-bold">المستحقات</h2>
            <p className="mb-3 text-xs text-slate-500">قفل الشهر بيثبّت المبلغ، فأي تعديل بعد كده في الحضور مش هيغير اللي اتحسب.</p>
            {!lastClosed && (
              <ActionForm action={closeMonthAction.bind(null, t.id)} submit={`قفل شهر ${lastMonth} (${nLast} حصة)`} submitClass="btn-outline" confirm="متأكد؟ المبلغ هيتثبت.">
                <input type="hidden" name="month" value={lastMonth} />
              </ActionForm>
            )}
            {closed.length > 0 && (
              <table className="table mt-4">
                <thead><tr><th>الشهر</th><th>الحصص</th><th>المبلغ</th><th>الصرف</th></tr></thead>
                <tbody>
                  {closed.map((p) => (
                    <tr key={p.id}>
                      <td>{p.month}</td>
                      <td>{p.lessons}</td>
                      <td>{fmtMoney(p.amountEgp)}</td>
                      <td>
                        {p.paidOn ? <Badge tone="green">اتصرف {p.paidOn}</Badge> : (
                          <ActionForm action={markPaidAction.bind(null, t.id, p.id)} submit="اتصرف" submitClass="btn-sm btn" className="flex items-end gap-2">
                            <input type="date" name="paidOn" required defaultValue={now.toISOString().slice(0, 10)} className="input !py-1 text-xs" />
                          </ActionForm>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        <PortalAccountCard kind="teacher" id={t.id} defaultEmail={t.email} />
        <section className="card lg:col-span-2">
          <h2 className="mb-3 font-bold">بيانات المدرس</h2>
          <ActionForm action={updateTeacherAction.bind(null, t.id)}><TeacherFields t={t} /></ActionForm>
        </section>
      </div>
      {isAdmin && <TeacherDelete id={t.id} name={t.name} />}
    </div>
  );
}

async function TeacherDelete({ id, name }: { id: number; name: string }) {
  const f = await teacherFootprint(getDb(), id);
  return (
    <DeleteCard
      title="مسح المدرس نهائيًا"
      action={deleteTeacherAction.bind(null, id)}
      submit="مسح المدرس"
      confirm={`متأكد إنك عايز تمسح «${name}» نهائيًا؟\nهيتمسح معاه: ${f.lessons} حصة، ${f.groups} مجموعة، مستحقاته، وحسابه على الموقع.\nالطلاب مش هيتمسحوا، وأي حصة اتخصمت من رصيدهم معاه هترجع لهم.\nمينفعش ترجّعه تاني.`}
    >
      <p>استخدمه للمدرسين اللي اتضافوا للتجربة أو بالغلط. هيتمسح معاه حصصه ومجموعاته ومستحقاته وحسابه على الموقع. الطلاب نفسهم مش بيتمسحوا.</p>
      <p className="mt-1">لو مدرس حقيقي ومشي، الأحسن تغيّر حالته لـ«متوقف» تحت علشان حصصه القديمة وحساباته تفضل موجودة.</p>
    </DeleteCard>
  );
}
