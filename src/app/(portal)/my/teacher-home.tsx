import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { payouts } from "@/db/schema";
import type { CurrentUser } from "@/server/session";
import { teacherOf } from "@/server/services/portal";
import { listLessons } from "@/server/services/schedule";
import { getSettings, teacherMonthLessons } from "@/server/services/money";
import { fmtMoney, mulMoney } from "@/lib/domain/rules";
import { fmtDate, fmtTime, monthKey, inZone, timezoneLabel } from "@/lib/domain/time";
import { PageHeader, Kpi, Empty, Badge, JoinButton } from "@/components/ui";

export async function TeacherHome({ user }: { user: CurrentUser }) {
  const db = getDb();
  const t = await teacherOf(db, user);
  if (!t) return <Empty>الحساب ده مش مربوط بمدرس. كلم الأكاديمية.</Empty>;
  const s = await getSettings(db);
  const tz = t.timezone;
  const now = new Date();
  const month = monthKey(now, s.academyTimezone);
  const today = inZone(now, tz).startOf("day");
  const [upcoming, past, nMonth, closed] = await Promise.all([
    listLessons(db, { from: today.toJSDate(), to: today.plus({ days: 8 }).toJSDate(), teacherId: t.id }),
    listLessons(db, { from: today.minus({ days: 14 }).toJSDate(), to: now, teacherId: t.id }),
    teacherMonthLessons(db, t.id, month, s.academyTimezone),
    db.select().from(payouts).where(eq(payouts.teacherId, t.id)).orderBy(desc(payouts.month)).limit(6),
  ]);
  const unrecorded = past.filter((l) => l.recorded === 0);
  const todayIso = today.toISODate();
  const todays = upcoming.filter((l) => inZone(l.startsAt, tz).toISODate() === todayIso);

  return (
    <div>
      <PageHeader title={`أهلًا ${t.name}`} subtitle={`المواعيد بتوقيت ${timezoneLabel(tz)}`} />
      {!t.meetingUrl && (
        <div className="mb-6 rounded-lg bg-accent-soft p-3 text-sm text-accent">لسه ملكش رابط حصة ثابت. ابعت رابط Meet أو Zoom بتاعك للأكاديمية علشان يظهر لطلابك.</div>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="حصص النهارده" value={todays.length} />
        <Kpi label="محتاجة تسجيل حضور" value={unrecorded.length} tone={unrecorded.length ? "red" : undefined} />
        <Kpi label="حصص الشهر ده" value={nMonth} />
        <Kpi label="مستحقات الشهر ده" value={fmtMoney(mulMoney(t.payPerLessonEgp, nMonth))} />
      </div>

      {unrecorded.length > 0 && (
        <section className="card mb-6 border-red-200">
          <h2 className="mb-3 font-bold text-red-700">سجّل الحضور للحصص دي</h2>
          <ul className="space-y-2">
            {unrecorded.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{fmtDate(l.startsAt, tz)} · {fmtTime(l.startsAt, tz)} · {l.title}</span>
                <Link href={`/my/lessons/${l.id}`} className="btn btn-sm">سجّل</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mb-6">
        <h2 className="mb-3 font-bold">حصصك الأسبوع ده</h2>
        {upcoming.length === 0 ? <Empty>مفيش حصص.</Empty> : (
          <table className="table">
            <tbody>
              {upcoming.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap">
                    <Link href={`/my/lessons/${l.id}`} className="link">{fmtDate(l.startsAt, tz)} · {fmtTime(l.startsAt, tz)}</Link>
                  </td>
                  <td>{l.title}{l.originalStartsAt && <span className="text-xs text-slate-500"> · اتنقلت</span>}</td>
                  <td className="text-left">{l.recorded > 0 ? <Badge tone="green">اتسجل</Badge> : <JoinButton url={l.joinUrl} small />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 font-bold">مستحقاتك</h2>
        <p className="mb-3 text-sm text-slate-600">أجر الحصة: {fmtMoney(t.payPerLessonEgp)}</p>
        {closed.length === 0 ? <Empty>لسه مفيش شهور اتقفلت.</Empty> : (
          <table className="table">
            <thead><tr><th>الشهر</th><th>الحصص</th><th>المبلغ</th><th>الصرف</th></tr></thead>
            <tbody>
              {closed.map((p) => (
                <tr key={p.id}>
                  <td>{p.month}</td>
                  <td>{p.lessons}</td>
                  <td>{fmtMoney(p.amountEgp)}</td>
                  <td>{p.paidOn ? <Badge tone="green">اتصرف {p.paidOn}</Badge> : <Badge tone="accent">لسه</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
