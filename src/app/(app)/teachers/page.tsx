import Link from "next/link";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listTeachers } from "@/server/services/people";
import { fmtMoney } from "@/lib/domain/rules";
import { PageHeader, Empty, StatusBadge, Badge } from "@/components/ui";

export const metadata = { title: "المدرسين" };

export default async function Teachers() {
  await requireStaff();
  const rows = await listTeachers(getDb());
  return (
    <div>
      <PageHeader title="المدرسين" subtitle={`${rows.length} مدرس`} actions={<Link href="/teachers/new" className="btn">+ مدرس جديد</Link>} />
      <div className="card overflow-x-auto !p-0">
        {rows.length === 0 ? <div className="p-5"><Empty>مفيش مدرسين لسه.</Empty></div> : (
          <table className="table">
            <thead><tr><th>الاسم</th><th>المواد</th><th>رابط الحصة</th><th>أجر الحصة</th><th>الحالة</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><Link className="link" href={`/teachers/${t.id}`}>{t.name}</Link></td>
                  <td className="text-slate-600">{t.subjects ?? "—"}</td>
                  <td>{t.meetingUrl ? <Badge tone="green">موجود</Badge> : <Badge tone="accent">ناقص</Badge>}</td>
                  <td>{fmtMoney(t.payPerLessonEgp)}</td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
