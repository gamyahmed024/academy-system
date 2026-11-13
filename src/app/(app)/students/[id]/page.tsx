import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { getStudent } from "@/server/services/people";
import { listLessons } from "@/server/services/schedule";
import { getSettings, listPayments, studentAttendance, walletHistory } from "@/server/services/money";
import { fmtDate, fmtTime, timezoneLabel } from "@/lib/domain/time";
import { ATTENDANCE_LABELS, fmtMoney } from "@/lib/domain/rules";
import { PortalAccountCard } from "@/components/portal-account";
import { requestLangOf } from "@/server/services/requests";
import { studentFootprint } from "@/server/services/cleanup";
import { DeleteCard } from "@/components/delete-card";
import { deleteStudentAction } from "../actions";
import { PageHeader, BackLink, Kpi, Badge, Empty, StatusBadge, JoinButton, whatsappLink } from "@/components/ui";

export const metadata = { title: "ملف الطالب" };

const stateTone = { present: "green", late: "accent", absent: "red", excused: "blue", teacher_cancelled: "gray" } as const;

export default async function StudentPage(props: PageProps<"/students/[id]">) {
  const user = await requireStaff();
  const id = Number((await props.params).id);
  const db = getDb();
  const s = Number.isInteger(id) ? await getStudent(db, id) : null;
  if (!s) notFound();
  const settings = await getSettings(db);
  const tz = settings.academyTimezone;
  const now = new Date();
  const [upcoming, att, pays, ledger] = await Promise.all([
    listLessons(db, { from: now, to: new Date(now.getTime() + 30 * 86_400_000), studentId: id }),
    studentAttendance(db, id),
    listPayments(db, { walletId: s.walletId }),
    walletHistory(db, s.walletId),
  ]);
  const counted = att.filter((a) => a.a.state !== "teacher_cancelled");
  const attended = counted.filter((a) => a.a.state === "present" || a.a.state === "late").length;
  const rate = counted.length ? Math.round((attended / counted.length) * 100) : null;
  const next = upcoming[0];
  const wa = whatsappLink(
    s.whatsapp,
    next
      ? `Hi ${s.name}! Your next lesson is ${fmtDate(next.startsAt, s.timezone)} at ${fmtTime(next.startsAt, s.timezone)} (your time).${next.joinUrl ? ` Join here: ${next.joinUrl}` : ""}`
      : `Hi ${s.name}!`,
  );

  return (
    <div>
      <BackLink href="/students">الطلاب</BackLink>
      <PageHeader
        title={s.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={s.status} />
            <span>{[s.country, timezoneLabel(s.timezone), s.subject, s.level].filter(Boolean).join(" · ")}</span>
          </span>
        }
        actions={
          <>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline">رسالة واتساب</a>}
            <Link href={`/payments/new?student=${s.id}`} className="btn-accent">+ دفعة</Link>
            <Link href={`/lessons/new?student=${s.id}`} className="btn-outline">+ حصة</Link>
            <Link href={`/students/${s.id}/edit`} className="btn">تعديل</Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={s.guardian ? "رصيد محفظة العيلة" : "الرصيد"} value={`${s.balance} حصة`} tone={s.balance < 0 ? "red" : s.balance <= settings.lowBalanceThreshold ? "accent" : "green"} />
        <Kpi label="نسبة الحضور" value={rate === null ? "—" : `${rate}%`} />
        <Kpi label="الحصص الجاية (30 يوم)" value={upcoming.length} />
        <Kpi label="آخر دفعة" value={pays[0] ? fmtMoney(pays[0].amount, pays[0].currency) : "—"} />
      </div>

      {s.guardian && (
        <div className="mb-6 rounded-lg bg-brand-soft p-4 text-sm">
          من عيلة <Link className="link" href={`/families/${s.guardian.id}`}>{s.guardian.name}</Link>
          {s.siblings.length > 0 && <> مع {s.siblings.map((x) => x.name).join("، ")}</>}. الرصيد مشترك بينهم.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-bold">الحصص الجاية</h2>
          {upcoming.length === 0 ? <Empty>مفيش حصص جاية.</Empty> : (
            <table className="table">
              <thead><tr><th>الميعاد (مصر)</th><th>عند الطالب</th><th>المدرس</th><th></th></tr></thead>
              <tbody>
                {upcoming.slice(0, 8).map((l) => (
                  <tr key={l.id}>
                    <td><Link className="link" href={`/lessons/${l.id}`}>{fmtDate(l.startsAt, tz)} · {fmtTime(l.startsAt, tz)}</Link></td>
                    <td>{fmtTime(l.startsAt, s.timezone)}</td>
                    <td>{l.teacherName}</td>
                    <td className="text-left"><JoinButton url={l.joinUrl} small /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 font-bold">آخر الحصص</h2>
          {att.length === 0 ? <Empty>لسه مفيش حضور متسجل.</Empty> : (
            <table className="table">
              <thead><tr><th>التاريخ</th><th>الحضور</th><th>اتخصمت؟</th><th>ملاحظة</th></tr></thead>
              <tbody>
                {att.slice(0, 10).map((a) => (
                  <tr key={a.a.id}>
                    <td><Link className="link" href={`/lessons/${a.lessonId}`}>{fmtDate(a.startsAt, tz)}</Link></td>
                    <td><Badge tone={stateTone[a.a.state]}>{ATTENDANCE_LABELS[a.a.state]}</Badge></td>
                    <td>{a.a.deducted ? "أيوه" : "لأ"}</td>
                    <td className="text-slate-600">{a.a.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 font-bold">المدفوعات</h2>
          {pays.length === 0 ? <Empty>مفيش مدفوعات.</Empty> : (
            <table className="table">
              <thead><tr><th>التاريخ</th><th>المبلغ</th><th>بالجنيه</th><th>الحصص</th><th>الإيصال</th></tr></thead>
              <tbody>
                {pays.slice(0, 10).map((p) => (
                  <tr key={p.id}>
                    <td>{p.paidOn}</td>
                    <td className="ltr">{fmtMoney(p.amount, p.currency)}</td>
                    <td>{fmtMoney(p.amountEgp)}</td>
                    <td>{p.lessonsCredited}</td>
                    <td><Link className="link ltr" href={`/payments/${p.id}`}>{p.receiptNo}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 font-bold">حركة الرصيد</h2>
          {ledger.length === 0 ? <Empty>مفيش حركة.</Empty> : (
            <ul className="divide-y divide-slate-100 text-sm">
              {ledger.slice(0, 12).map((e) => (
                <li key={e.e.id} className="flex justify-between py-2">
                  <span className="text-slate-600">
                    {e.receiptNo ? `دفعة ${e.receiptNo}` : e.state ? `${ATTENDANCE_LABELS[e.state]}${e.studentName && e.studentName !== s.name ? ` (${e.studentName})` : ""} · ${e.lessonStartsAt ? fmtDate(e.lessonStartsAt, tz) : ""}` : e.e.reason.startsWith("transfer") ? "نقل رصيد" : e.e.reason}
                  </span>
                  <span className={`font-bold ${e.e.delta > 0 ? "text-green-700" : "text-red-600"}`}>{e.e.delta > 0 ? `+${e.e.delta}` : e.e.delta}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <PortalAccountCard kind="student" id={s.id} defaultEmail={s.email} defaultLang={(await requestLangOf(getDb(), s.id)) ?? undefined} />
      </div>
      {s.notes && <div className="card mt-6 whitespace-pre-line text-sm"><b>ملاحظات:</b> {s.notes}</div>}
      {user.role === "admin" && <StudentDelete id={s.id} name={s.name} inFamily={!!s.guardian} />}
    </div>
  );
}

async function StudentDelete({ id, name, inFamily }: { id: number; name: string; inFamily: boolean }) {
  const f = await studentFootprint(getDb(), id);
  return (
    <DeleteCard
      title="مسح الطالب نهائيًا"
      action={deleteStudentAction.bind(null, id)}
      submit="مسح الطالب"
      confirm={`متأكد إنك عايز تمسح «${name}» نهائيًا؟\nهيتمسح معاه: ${f.lessons} حصة، ${f.attendance} تسجيل حضور، ${f.payments} دفعة، وحسابه على الموقع.\nمينفعش ترجّعه تاني.`}
    >
      <p>استخدمه للطلاب اللي اتضافوا للتجربة أو بالغلط. هيتمسح معاه حصصه وحضوره ومدفوعاته{inFamily ? " (اللي اتسجلت باسمه، ورصيد العيلة الباقي يفضل زي ما هو)" : ""} وحسابه على الموقع.</p>
      <p className="mt-1">لو طالب حقيقي ووقف، الأحسن تغيّر حالته لـ«متوقف» من «تعديل» علشان تاريخه يفضل موجود.</p>
    </DeleteCard>
  );
}
