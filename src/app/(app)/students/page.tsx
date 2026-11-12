import Link from "next/link";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listStudents } from "@/server/services/people";
import { timezoneLabel } from "@/lib/domain/time";
import { PageHeader, Empty, StatusBadge, BalanceBadge, STATUS_OPTIONS } from "@/components/ui";

export const metadata = { title: "الطلاب" };

export default async function Students(props: PageProps<"/students">) {
  await requireStaff();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const rows = await listStudents(getDb(), { q, status });
  return (
    <div>
      <PageHeader title="الطلاب" subtitle={`${rows.length} طالب`} actions={<Link href="/students/new" className="btn">+ طالب جديد</Link>} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="دوّر بالاسم أو الإيميل" className="input max-w-xs" />
        <select name="status" defaultValue={status} className="input max-w-[12rem]">
          <option value="">كل الحالات</option>
          {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn-outline">بحث</button>
      </form>
      <div className="card overflow-x-auto !p-0">
        {rows.length === 0 ? (
          <div className="p-5"><Empty>مفيش طلاب لسه. <Link className="link" href="/students/new">ضيف أول طالب</Link></Empty></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>الاسم</th><th>التوقيت</th><th>المادة / المستوى</th><th>العيلة</th><th>الرصيد</th><th>الحالة</th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td><Link className="link" href={`/students/${s.id}`}>{s.name}</Link>{s.country && <div className="text-xs text-slate-500">{s.country}</div>}</td>
                  <td className="text-slate-600">{timezoneLabel(s.timezone)}</td>
                  <td className="text-slate-600">{[s.subject, s.level].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="text-slate-600">{s.guardianName ?? "—"}</td>
                  <td><BalanceBadge balance={s.balance} /></td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
