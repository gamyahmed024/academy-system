import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { getPayment, getSettings } from "@/server/services/money";
import { fmtMoney } from "@/lib/domain/rules";
import { BackLink } from "@/components/ui";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "إيصال" };

export default async function Receipt(props: PageProps<"/payments/[id]">) {
  await requireStaff();
  const id = Number((await props.params).id);
  const db = getDb();
  const p = Number.isInteger(id) ? await getPayment(db, id) : null;
  if (!p) notFound();
  const s = await getSettings(db);
  return (
    <div className="max-w-xl">
      <div className="print:hidden"><BackLink href="/payments">المدفوعات</BackLink></div>
      <div className="card print:border-0 print:shadow-none">
        <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-xl font-extrabold text-brand">{s.academyName}</div>
            <div className="text-sm text-slate-500">إيصال استلام · Payment receipt</div>
          </div>
          <div className="ltr text-left text-sm font-bold">{p.receiptNo}</div>
        </div>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-slate-500">استلمنا من · Received from</dt><dd className="font-semibold">{p.payer}</dd>
          <dt className="text-slate-500">المبلغ · Amount</dt><dd className="ltr text-right text-lg font-extrabold">{fmtMoney(p.amount, p.currency)}</dd>
          <dt className="text-slate-500">التاريخ · Date</dt><dd>{p.paidOn}</dd>
          <dt className="text-slate-500">طريقة الدفع · Method</dt><dd>{p.method}</dd>
          <dt className="text-slate-500">عدد الحصص · Lessons</dt><dd>{p.lessonsCredited}</dd>
          {p.note && (<><dt className="text-slate-500">ملاحظة · Note</dt><dd>{p.note}</dd></>)}
        </dl>
        <p className="mt-6 border-t border-slate-100 pt-3 text-xs text-slate-400 print:hidden">
          داخلي: سعر الصرف {Number(p.rateToEgp)} · بالجنيه {fmtMoney(p.amountEgp)}
        </p>
      </div>
      <div className="mt-4 print:hidden"><PrintButton /></div>
    </div>
  );
}
