import Link from "next/link";
import { DateTime } from "luxon";
import { AR } from "@/lib/domain/time";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listPayments, getSettings } from "@/server/services/money";
import { fmtMoney, sumMoney } from "@/lib/domain/rules";
import { PageHeader, Empty, Kpi } from "@/components/ui";

export const metadata = { title: "المدفوعات" };

export default async function Payments(props: PageProps<"/payments">) {
  const user = await requireStaff();
  const sp = await props.searchParams;
  const db = getDb();
  const tz = (await getSettings(db)).academyTimezone;
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : DateTime.now().setZone(tz).toFormat("yyyy-MM");
  const m = DateTime.fromISO(`${month}-01`);
  const rows = await listPayments(db, { month });
  const total = sumMoney(rows.map((r) => r.amountEgp));
  return (
    <div>
      <PageHeader
        title={`المدفوعات · ${m.setLocale(AR).toFormat("LLLL yyyy")}`}
        actions={
          <>
            <Link href={`/payments?month=${m.minus({ months: 1 }).toFormat("yyyy-MM")}`} className="btn-outline">→ الشهر اللي فات</Link>
            <Link href={`/payments?month=${m.plus({ months: 1 }).toFormat("yyyy-MM")}`} className="btn-outline">الجاي ←</Link>
            <Link href="/payments/new" className="btn-accent">+ تسجيل دفعة</Link>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="عدد الدفعات" value={rows.length} />
        {user.role === "admin" && <Kpi label="الإجمالي بالجنيه (بسعر يوم الدفع)" value={fmtMoney(total)} tone="green" />}
      </div>
      <div className="card overflow-x-auto !p-0">
        {rows.length === 0 ? <div className="p-5"><Empty>مفيش مدفوعات في الشهر ده.</Empty></div> : (
          <table className="table">
            <thead><tr><th>التاريخ</th><th>الدافع</th><th>المبلغ</th><th>سعر الصرف</th><th>بالجنيه</th><th>الحصص</th><th>الطريقة</th><th>الإيصال</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.paidOn}</td>
                  <td>{p.payer}{p.guardianId && <span className="text-xs text-slate-500"> (عيلة)</span>}</td>
                  <td className="ltr font-semibold">{fmtMoney(p.amount, p.currency)}</td>
                  <td className="text-slate-500">{p.currency === "EGP" ? "—" : Number(p.rateToEgp)}</td>
                  <td>{fmtMoney(p.amountEgp)}</td>
                  <td>{p.lessonsCredited}</td>
                  <td>{p.method}</td>
                  <td><Link className="link ltr" href={`/payments/${p.id}`}>{p.receiptNo}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
