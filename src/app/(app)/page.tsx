import Link from "next/link";
import { sql, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { students } from "@/db/schema";
import { requireStaff } from "@/server/session";
import { listLessons } from "@/server/services/schedule";
import { getSettings, monthReport, lowBalanceStudents } from "@/server/services/money";
import { dayBounds, fmtTime, fmtDate, monthKey, inZone } from "@/lib/domain/time";
import { fmtMoney } from "@/lib/domain/rules";
import { PageHeader, Kpi, Badge, Empty, JoinButton, BalanceBadge } from "@/components/ui";

export const metadata = { title: "الرئيسية" };

export default async function Dashboard(props: PageProps<"/">) {
  const user = await requireStaff();
  const { denied } = await props.searchParams;
  const db = getDb();
  const s = await getSettings(db);
  const tz = s.academyTimezone;
  const now = new Date();
  const today = dayBounds(now, tz);
  const [todayLessons, recent, low, [{ n: activeCount }]] = await Promise.all([
    listLessons(db, { from: today.start, to: today.end, includeCancelled: true }),
    listLessons(db, { from: new Date(now.getTime() - 14 * 86_400_000), to: now }),
    lowBalanceStudents(db),
    db.select({ n: sql<number>`count(*)::int` }).from(students).where(inArray(students.status, ["active", "trial"])),
  ]);
  const pending = recent.filter((l) => l.status === "scheduled" && l.recorded === 0);
  const report = user.role === "admin" ? await monthReport(db, monthKey(now, tz)) : null;
  const hour = Number(inZone(now, tz).toFormat("H"));

  return (
    <div>
      {denied && <div className="mb-4 rounded-lg bg-accent-soft p-3 text-sm text-accent">الصفحة دي للإدارة بس.</div>}
      <PageHeader
        title={`${hour < 12 ? "صباح الخير" : "مساء الخير"} يا ${user.name}`}
        subtitle={fmtDate(now, tz)}
        actions={
          <>
            <Link href="/students/new" className="btn-outline">+ طالب</Link>
            <Link href="/lessons/new" className="btn">+ حصة</Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="طلاب نشطين" value={activeCount} />
        <Kpi label="حصص النهارده" value={todayLessons.filter((l) => l.status !== "cancelled").length} />
        {report ? <Kpi label="دخل الشهر" value={fmtMoney(report.revenueEgp)} /> : <Kpi label="محتاجة تسجيل حضور" value={pending.length} tone={pending.length ? "accent" : undefined} />}
        <Kpi label="رصيدهم خلص أو قرب" value={low.length} tone={low.length ? "red" : undefined} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <h2 className="mb-3 font-bold">حصص النهارده</h2>
          {todayLessons.length === 0 ? (
            <Empty>مفيش حصص النهارده.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>الوقت</th>
                    <th>الطالب / المجموعة</th>
                    <th>المدرس</th>
                    <th>الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {todayLessons.map((l) => (
                    <tr key={l.id} className={l.status === "cancelled" ? "opacity-50" : ""}>
                      <td className="whitespace-nowrap">
                        <div className="font-semibold">{fmtTime(l.startsAt, tz)}</div>
                        {l.studentTimezone && l.studentTimezone !== tz && (
                          <div className="text-xs text-slate-500">عنده {fmtTime(l.startsAt, l.studentTimezone)}</div>
                        )}
                      </td>
                      <td>
                        <Link className="link" href={`/lessons/${l.id}`}>{l.title}</Link>
                      </td>
                      <td>{l.teacherName}</td>
                      <td>
                        {l.status === "cancelled" ? (
                          <Badge>ملغية</Badge>
                        ) : l.recorded ? (
                          <Badge tone="green">اتسجل الحضور</Badge>
                        ) : l.startsAt < now ? (
                          <Badge tone="accent">محتاجة تسجيل</Badge>
                        ) : (
                          <Badge tone="blue">جاية</Badge>
                        )}
                      </td>
                      <td className="text-left">{l.status !== "cancelled" && <JoinButton url={l.joinUrl} small />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 font-bold">رصيدهم خلص أو قرب يخلص</h2>
          {low.length === 0 ? (
            <Empty>كل الطلاب عندهم رصيد.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {low.slice(0, 12).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <Link className="link" href={`/students/${s.id}`}>{s.name}</Link>
                    {s.guardianName && <span className="text-xs text-slate-500"> · عيلة {s.guardianName}</span>}
                  </span>
                  <BalanceBadge balance={s.balance} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {pending.length > 0 && (
        <section className="card mt-6">
          <h2 className="mb-3 font-bold">
            حصص فاتت ولسه متسجلش حضورها <Badge tone="accent">{pending.length}</Badge>
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pending.slice(0, 18).map((l) => (
              <li key={l.id}>
                <Link href={`/lessons/${l.id}`} className="block rounded-lg border border-slate-200 p-3 text-sm hover:border-brand">
                  <div className="font-semibold">{l.title}</div>
                  <div className="text-slate-500">
                    {fmtDate(l.startsAt, tz)} · {fmtTime(l.startsAt, tz)} · {l.teacherName}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
