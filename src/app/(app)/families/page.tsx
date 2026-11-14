import Link from "next/link";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listGuardians } from "@/server/services/people";
import { PageHeader, Empty, BalanceBadge } from "@/components/ui";

export const metadata = { title: "العائلات" };

export default async function Families(props: PageProps<"/families">) {
  await requireStaff();
  const deleted = (await props.searchParams).deleted === "1";
  const rows = await listGuardians(getDb());
  return (
    <div>
      <PageHeader
        title="العائلات"
        subtitle="ولي أمر واحد بيدفع لأكتر من طالب، والحصص بتتخصم من محفظة واحدة مشتركة"
        actions={<Link href="/families/new" className="btn">+ عيلة جديدة</Link>}
      />
      {deleted && <div role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">✓ اتمسحت العيلة وأولادها.</div>}
      <div className="card overflow-x-auto !p-0">
        {rows.length === 0 ? (
          <div className="p-5"><Empty>مفيش عائلات لسه.</Empty></div>
        ) : (
          <table className="table">
            <thead><tr><th>ولي الأمر</th><th>الأولاد</th><th>رصيد المحفظة</th></tr></thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td><Link className="link" href={`/families/${g.id}`}>{g.name}</Link></td>
                  <td>{g.children.map((c) => c.name).join("، ") || <span className="text-slate-400">لسه مفيش</span>}</td>
                  <td><BalanceBadge balance={g.balance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
