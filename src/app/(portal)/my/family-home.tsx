import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { students } from "@/db/schema";
import type { CurrentUser } from "@/server/session";
import { studentOf, guardianOf, visibleStudentIds, lessonsForStudents } from "@/server/services/portal";
import { walletBalance } from "@/server/services/people";
import { getSettings, listPayments, studentAttendance } from "@/server/services/money";
import { ATTENDANCE_LABELS, fmtMoney } from "@/lib/domain/rules";
import { fmtDate, fmtTime, inZone, timezoneLabel } from "@/lib/domain/time";
import { ActionForm } from "@/components/action-form";
import { PageHeader, Kpi, Empty, Badge, JoinButton } from "@/components/ui";
import { excuseAction } from "./actions";

export async function FamilyHome({ user }: { user: CurrentUser }) {
  const db = getDb();
  const s = await getSettings(db);
  const me = user.role === "student" ? await studentOf(db, user) : await guardianOf(db, user);
  if (!me) return <Empty>الحساب ده مش مربوط بطالب أو ولي أمر. كلم الأكاديمية.</Empty>;
  const ids = await visibleStudentIds(db, user);
  const kids = ids.length ? await db.select().from(students).where(inArray(students.id, ids)) : [];
  const name = new Map(kids.map((k) => [k.id, k.name]));
  const tz = me.timezone;
  const now = new Date();
  const soonEnd = inZone(now, tz).startOf("day").plus({ days: 15 }).toJSDate();
  const [balance, upcoming, payments, history] = await Promise.all([
    walletBalance(db, me.walletId),
    lessonsForStudents(db, ids, new Date(now.getTime() - 60 * 60_000), soonEnd),
    listPayments(db, { walletId: me.walletId }),
    Promise.all(ids.map((id) => studentAttendance(db, id, 10))),
  ]);
  const active = upcoming.filter((l) => l.status !== "cancelled");
  const next = active.find((l) => l.startsAt.getTime() + l.minutes * 60_000 > now.getTime() && !l.attendance);
  const recent = history
    .flatMap((rows, i) => rows.map((r) => ({ ...r, studentId: ids[i] })))
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .slice(0, 12);
  const isGuardian = user.role === "guardian";
  const low = balance <= s.lowBalanceThreshold;

  return (
    <div>
      <PageHeader title={`أهلًا ${me.name}`} subtitle={`المواعيد بتوقيت ${timezoneLabel(tz)}`} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi label={isGuardian ? "رصيد العيلة (حصص)" : "رصيدك (حصص)"} value={balance} tone={balance < 0 ? "red" : low ? "accent" : "green"} />
        <Kpi label="حصص الأسبوعين الجايين" value={active.filter((l) => l.startsAt > now).length} />
        {isGuardian && <Kpi label="الأولاد" value={kids.length} />}
      </div>
      {low && (
        <p className="mb-6 rounded-lg bg-accent-soft p-3 text-sm text-accent">
          {balance < 0 ? `الرصيد بالسالب (${balance}).` : "الرصيد قرب يخلص."} كلم الأكاديمية علشان تجدد الباقة.
        </p>
      )}

      {next && (
        <section className="card mb-6 border-brand bg-brand-soft">
          <div className="text-sm text-slate-600">الحصة الجاية{isGuardian ? ` · ${name.get(next.studentId)}` : ""}</div>
          <div className="mt-1 text-xl font-extrabold">{fmtDate(next.startsAt, tz)} · {fmtTime(next.startsAt, tz)}</div>
          <div className="mb-3 text-sm text-slate-600">مع {next.teacherName} · {next.minutes} دقيقة</div>
          <JoinButton url={next.joinUrl} />
        </section>
      )}

      <section className="card mb-6">
        <h2 className="mb-1 font-bold">المواعيد الجاية</h2>
        <p className="mb-3 text-xs text-slate-500">
          لو اعتذرت قبل الحصة بـ {s.freeCancelHours} ساعة أو أكتر، الحصة مش بتتخصم. بعد كده بتتخصم.
        </p>
        {upcoming.length === 0 ? <Empty>مفيش حصص في الأسبوعين الجايين.</Empty> : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((l) => {
              const hoursLeft = (l.startsAt.getTime() - now.getTime()) / 3_600_000;
              return (
                <li key={`${l.id}-${l.studentId}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <div className="font-semibold">
                      {fmtDate(l.startsAt, tz)} · {fmtTime(l.startsAt, tz)}
                      {isGuardian && <span className="font-normal text-slate-600"> · {name.get(l.studentId)}</span>}
                    </div>
                    <div className="text-xs text-slate-500">مع {l.teacherName}{l.originalStartsAt ? " · اتنقلت" : ""}</div>
                  </div>
                  {l.status === "cancelled" ? <Badge tone="red">اتلغت</Badge>
                    : l.attendance ? (
                      <Badge tone={l.attendance.state === "excused" ? "gray" : "green"}>
                        {ATTENDANCE_LABELS[l.attendance.state]} · {l.attendance.deducted ? "اتخصمت" : "متخصمتش"}
                      </Badge>
                    )
                    : hoursLeft > 0 ? (
                      <ActionForm
                        action={excuseAction.bind(null, l.id, l.studentId)}
                        submit="اعتذار"
                        submitClass="btn-outline btn-sm"
                        className="[&>div]:mt-0"
                        confirm={hoursLeft >= s.freeCancelHours
                          ? "تأكيد الاعتذار عن الحصة دي؟ مش هتتخصم من الرصيد."
                          : `فاضل أقل من ${s.freeCancelHours} ساعة على الحصة، فلو اعتذرت هتتخصم من الرصيد. تأكيد؟`}
                      >{null}</ActionForm>
                    ) : <JoinButton url={l.joinUrl} small />}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-bold">آخر الحصص</h2>
          {recent.length === 0 ? <Empty>لسه مفيش حصص متسجلة.</Empty> : (
            <table className="table">
              <tbody>
                {recent.map((r) => (
                  <tr key={r.a.id}>
                    <td className="whitespace-nowrap">{fmtDate(r.startsAt, tz)}</td>
                    {isGuardian && <td>{name.get(r.studentId)}</td>}
                    <td>{ATTENDANCE_LABELS[r.a.state]}{r.a.note && <div className="text-xs text-slate-500">{r.a.note}</div>}</td>
                    <td className="text-left text-xs text-slate-500">{r.a.deducted ? "اتخصمت" : "متخصمتش"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="card">
          <h2 className="mb-3 font-bold">المدفوعات</h2>
          {payments.length === 0 ? <Empty>مفيش مدفوعات.</Empty> : (
            <table className="table">
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{p.paidOn}</td>
                    <td className="ltr whitespace-nowrap">{fmtMoney(p.amount, p.currency)}</td>
                    <td className="whitespace-nowrap">+{p.lessonsCredited} حصة</td>
                    <td className="hidden text-left text-xs text-slate-500 ltr sm:table-cell">{p.receiptNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
