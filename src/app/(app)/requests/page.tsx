import Link from "next/link";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listTrialRequests, REQUEST_STATUSES } from "@/server/services/requests";
import { fmtDateTime, timezoneLabel } from "@/lib/domain/time";
import { getSettings } from "@/server/services/money";
import { LANGS, isLang } from "@/lib/i18n";
import { PageHeader, Empty, Badge, whatsappLink } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { updateRequestAction } from "./actions";

export const metadata = { title: "طلبات الحصص التجريبية" };

const STATUS: Record<string, [string, "accent" | "blue" | "green" | "gray"]> = {
  new: ["جديد", "accent"],
  contacted: ["اتواصلنا معاه", "blue"],
  enrolled: ["اشترك", "green"],
  closed: ["مقفول", "gray"],
};
const LEVEL: Record<string, string> = {
  none: "مبتدئ تمامًا",
  basic: "يعرف الحروف وكلمات",
  intermediate: "بيفهم ويتكلم شوية",
  advanced: "متقدم",
};

export default async function Requests(props: PageProps<"/requests">) {
  await requireStaff();
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" ? sp.status : "new";
  const db = getDb();
  const [rows, s] = await Promise.all([listTrialRequests(db, status === "all" ? undefined : status), getSettings(db)]);
  const tabs: [string, string][] = [...REQUEST_STATUSES.map((v) => [v, STATUS[v][0]] as [string, string]), ["all", "الكل"]];

  return (
    <div>
      <PageHeader title="طلبات الحصص التجريبية" subtitle="اللي الزوار بعتوه من فورم الصفحة الرئيسية" />
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([v, l]) => (
          <Link key={v} href={`/requests?status=${v}`} className={v === status ? "btn btn-sm" : "btn-outline btn-sm"}>
            {l}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty>مفيش طلبات هنا.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => {
            const langName = isLang(r.lang) ? LANGS[r.lang].langName : r.lang;
            const wa = whatsappLink(r.whatsapp, `السلام عليكم ${r.name}، معاك ${s.academyName} بخصوص طلب الحصة التجريبية.`);
            const newStudent = `/students/new?${new URLSearchParams({ name: r.name, email: r.email, phone: r.whatsapp ?? "", country: r.country ?? "", timezone: r.timezone ?? "" })}`;
            return (
              <div key={r.id} className="card">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">{r.name}</div>
                    <div className="text-xs text-slate-500">{fmtDateTime(r.createdAt, s.academyTimezone)}</div>
                  </div>
                  <Badge tone={STATUS[r.status][1]}>{STATUS[r.status][0]}</Badge>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-slate-500">الإيميل</dt>
                  <dd><a className="link ltr" href={`mailto:${r.email}`}>{r.email}</a></dd>
                  <dt className="text-slate-500">واتساب</dt>
                  <dd>{wa ? <a className="link ltr" href={wa} target="_blank" rel="noopener noreferrer">{r.whatsapp}</a> : "—"}</dd>
                  <dt className="text-slate-500">البلد</dt>
                  <dd>{r.country ?? "—"}{r.timezone && <span className="text-slate-500"> · {timezoneLabel(r.timezone)}</span>}</dd>
                  <dt className="text-slate-500">الحصة لـ</dt>
                  <dd>{r.forWhom === "child" ? "ابنه / بنته" : "نفسه"}</dd>
                  <dt className="text-slate-500">المستوى</dt>
                  <dd>{LEVEL[r.level] ?? r.level}</dd>
                  <dt className="text-slate-500">المواعيد</dt>
                  <dd>{r.preferredTimes ?? "—"}</dd>
                  <dt className="text-slate-500">لغة الصفحة</dt>
                  <dd>{langName}</dd>
                </dl>
                {r.message && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-line" dir="auto">{r.message}</p>}
                <ActionForm action={updateRequestAction} submit="حفظ" submitClass="btn btn-sm" className="mt-3 border-t border-slate-100 pt-3">
                  <input type="hidden" name="id" value={r.id} />
                  <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                    <select name="status" defaultValue={r.status} className="input">
                      {REQUEST_STATUSES.map((v) => <option key={v} value={v}>{STATUS[v][0]}</option>)}
                    </select>
                    <input name="staffNote" defaultValue={r.staffNote ?? ""} placeholder="ملاحظة (مثلًا: الحصة يوم السبت 6 مساءً)" className="input" />
                  </div>
                </ActionForm>
                <Link href={newStudent} className="link mt-2 inline-block text-sm">+ اعمله ملف طالب</Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
