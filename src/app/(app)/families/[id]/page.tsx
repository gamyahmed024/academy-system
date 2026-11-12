import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { getGuardian } from "@/server/services/people";
import { listPayments } from "@/server/services/money";
import { fmtMoney } from "@/lib/domain/rules";
import { timezoneLabel } from "@/lib/domain/time";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink, Kpi, Empty, StatusBadge } from "@/components/ui";
import { GuardianFields } from "../guardian-form";
import { updateGuardianAction } from "../actions";

export const metadata = { title: "العيلة" };

export default async function FamilyPage(props: PageProps<"/families/[id]">) {
  await requireStaff();
  const id = Number((await props.params).id);
  const db = getDb();
  const g = Number.isInteger(id) ? await getGuardian(db, id) : null;
  if (!g) notFound();
  const pays = await listPayments(db, { walletId: g.walletId });
  return (
    <div>
      <BackLink href="/families">العائلات</BackLink>
      <PageHeader
        title={`عيلة ${g.name}`}
        subtitle={timezoneLabel(g.timezone)}
        actions={
          <>
            <Link href={`/payments/new?guardian=${g.id}`} className="btn-accent">+ دفعة للعيلة</Link>
            <Link href={`/students/new`} className="btn-outline">+ طالب</Link>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Kpi label="رصيد المحفظة المشتركة" value={`${g.balance} حصة`} tone={g.balance < 0 ? "red" : g.balance <= 1 ? "accent" : "green"} />
        <Kpi label="عدد الأولاد" value={g.children.length} />
        <Kpi label="المدفوعات" value={pays.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-bold">الأولاد</h2>
          {g.children.length === 0 ? <Empty>اربط الطلاب بالعيلة دي من صفحة تعديل الطالب.</Empty> : (
            <ul className="divide-y divide-slate-100">
              {g.children.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <Link className="link" href={`/students/${c.id}`}>{c.name}</Link>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2 className="mb-3 font-bold">المدفوعات</h2>
          {pays.length === 0 ? <Empty>مفيش مدفوعات.</Empty> : (
            <table className="table">
              <thead><tr><th>التاريخ</th><th>المبلغ</th><th>الحصص</th><th>الإيصال</th></tr></thead>
              <tbody>
                {pays.map((p) => (
                  <tr key={p.id}>
                    <td>{p.paidOn}</td>
                    <td className="ltr">{fmtMoney(p.amount, p.currency)}</td>
                    <td>{p.lessonsCredited}</td>
                    <td><Link className="link ltr" href={`/payments/${p.id}`}>{p.receiptNo}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="card lg:col-span-2">
          <h2 className="mb-3 font-bold">بيانات ولي الأمر</h2>
          <ActionForm action={updateGuardianAction.bind(null, g.id)}>
            <GuardianFields g={g} />
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
