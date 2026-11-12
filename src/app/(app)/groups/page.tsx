import Link from "next/link";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listGroups } from "@/server/services/people";
import { PageHeader, Empty } from "@/components/ui";

export const metadata = { title: "المجموعات" };

export default async function Groups() {
  await requireStaff();
  const rows = await listGroups(getDb());
  return (
    <div>
      <PageHeader title="المجموعات" actions={<Link href="/groups/new" className="btn">+ مجموعة جديدة</Link>} />
      {rows.length === 0 ? <Empty>مفيش مجموعات لسه.</Empty> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((g) => (
            <div key={g.id} className="card">
              <div className="flex items-start justify-between">
                <h2 className="font-bold">{g.name}</h2>
                <Link href={`/lessons/new?group=${g.id}`} className="btn-outline btn-sm">+ حصص</Link>
              </div>
              <p className="text-sm text-slate-500">{g.teacherName}{g.level ? ` · ${g.level}` : ""}</p>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {g.members.map((m) => <li key={m.id}><Link className="rounded-full bg-slate-100 px-3 py-1 hover:bg-brand-soft" href={`/students/${m.id}`}>{m.name}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
