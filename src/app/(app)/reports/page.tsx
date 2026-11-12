import Link from "next/link";
import { DateTime } from "luxon";
import { AR } from "@/lib/domain/time";
import { getDb } from "@/db";
import { requireAdmin } from "@/server/session";
import { monthReport, getSettings } from "@/server/services/money";
import { fmtMoney, CURRENCY_LABELS } from "@/lib/domain/rules";
import { PageHeader, Kpi, Badge, Empty } from "@/components/ui";

export const metadata = { title: "التقارير" };

export default async function Reports(props: PageProps<"/reports">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const db = getDb();
  const tz = (await getSettings(db)).academyTimezone;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : DateTime.now().setZone(tz).toFormat("yyyy-MM");
  const m = DateTime.fromISO(`${month}-01`);
  const months = [2, 1, 0].map((i) => m.minus({ months: i }).toFormat("yyyy-MM"));
  const [r, ...trend] = await Promise.all([monthReport(db, month), ...months.map((x) => monthReport(db, x))]);
  const max = Math.max(1, ...trend.map((t) => Number(t.revenueEgp)));

  return (
    <div>
      <PageHeader
        title={`تقرير ${m.setLocale(AR).toFormat("LLLL yyyy")}`}
        subtitle="الدخل محسوب بسعر الصرف يوم كل دفعة، فرقم الشهر ده مش هيتغير بعدين"
        actions={
          <>
            <Link href={`/reports?month=${m.minus({ months: 1 }).toFormat("yyyy-MM")}`} className="btn-outline">→ اللي فات</Link>
            <Link href={`/reports?month=${m.plus({ months: 1 }).toFormat("yyyy-MM")}`} className="btn-outline">الجاي ←</Link>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="الدخل" value={fmtMoney(r.revenueEgp)} />
        <Kpi label="مستحقات المدرسين" value={fmtMoney(r.teachersEgp)} />
        <Kpi label="الصافي التقريبي" value={fmtMoney(r.netEgp)} tone={Number(r.netEgp) >= 0 ? "green" : "red"} />
        <Kpi label="عدد الدفعات" value={r.payments} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-bold">الدخل حسب العملة</h2>
          {Object.keys(r.byCurrency).length === 0 ? <Empty>مفيش مدفوعات.</Empty> : (
            <table className="table">
              <tbody>
                {Object.entries(r.byCurrency).map(([c, v]) => (
                  <tr key={c}><td>{CURRENCY_LABELS[c] ?? c}</td><td className="ltr text-left font-semibold">{fmtMoney(v, c)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <h2 className="mb-3 mt-6 font-bold">آخر 3 شهور</h2>
          <div className="flex h-36 items-end gap-4">
            {trend.map((t) => (
              <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold">{fmtMoney(t.revenueEgp)}</span>
                <div className="w-full rounded-t bg-brand" style={{ height: `${Math.max(4, (Number(t.revenueEgp) / max) * 100)}px` }} />
                <span className="text-xs text-slate-500">{DateTime.fromISO(`${t.month}-01`).setLocale(AR).toFormat("LLLL")}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2 className="mb-3 font-bold">مستحقات المدرسين</h2>
          {r.teachers.length === 0 ? <Empty>مفيش مدرسين.</Empty> : (
            <table className="table">
              <thead><tr><th>المدرس</th><th>الحصص</th><th>المبلغ</th><th>الحالة</th></tr></thead>
              <tbody>
                {r.teachers.map((t) => (
                  <tr key={t.teacherId}>
                    <td><Link className="link" href={`/teachers/${t.teacherId}`}>{t.name}</Link></td>
                    <td>{t.lessons}</td>
                    <td>{fmtMoney(t.amountEgp)}</td>
                    <td>{t.paidOn ? <Badge tone="green">اتصرف</Badge> : t.closed ? <Badge tone="brand">متقفل</Badge> : <Badge>مفتوح</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-3 text-xs text-slate-500">&quot;مفتوح&quot; يعني الرقم ممكن يتغير لو اتعدل حضور. اقفل الشهر من صفحة المدرس علشان تثبته.</p>
        </section>
      </div>
    </div>
  );
}
