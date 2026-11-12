import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { students } from "@/db/schema";
import type { CurrentUser } from "@/server/session";
import { studentOf, guardianOf, visibleStudentIds, lessonsForStudents } from "@/server/services/portal";
import { walletBalance } from "@/server/services/people";
import { getSettings, listPayments, studentAttendance } from "@/server/services/money";
import { fmtMoney } from "@/lib/domain/rules";
import { getT } from "@/server/lang";
import { dateLocale, zoneLabel } from "@/lib/i18n";
import { fmtDate, fmtTime, inZone, timezoneLabel } from "@/lib/domain/time";
import { ActionForm } from "@/components/action-form";
import { PageHeader, Kpi, Empty, Badge, JoinButton } from "@/components/ui";
import { excuseAction } from "./actions";

export async function FamilyHome({ user }: { user: CurrentUser }) {
  const db = getDb();
  const { lang, t } = await getT();
  const s = await getSettings(db);
  const me = user.role === "student" ? await studentOf(db, user) : await guardianOf(db, user);
  if (!me) return <Empty>{t("notLinked")}</Empty>;
  const ids = await visibleStudentIds(db, user);
  const kids = ids.length ? await db.select().from(students).where(inArray(students.id, ids)) : [];
  const name = new Map(kids.map((k) => [k.id, k.name]));
  const tz = me.timezone;
  const loc = dateLocale(lang);
  const join = { label: t("joinLesson"), noLink: t("noLink") };
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
      <PageHeader title={t("hello", { name: me.name })} subtitle={t("timesIn", { zone: zoneLabel(lang, tz, timezoneLabel) })} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi label={isGuardian ? t("balanceFamily") : t("balanceOwn")} value={balance} tone={balance < 0 ? "red" : low ? "accent" : "green"} />
        <Kpi label={t("nextTwoWeeks")} value={active.filter((l) => l.startsAt > now).length} />
        {isGuardian && <Kpi label={t("children")} value={kids.length} />}
      </div>
      {low && (
        <p className="mb-6 rounded-lg bg-accent-soft p-3 text-sm text-accent">
          {balance < 0 ? t("balanceNegative", { n: balance }) : t("balanceLow")} {t("renewHint")}
        </p>
      )}

      {next && (
        <section className="card mb-6 border-brand bg-brand-soft">
          <div className="text-sm text-slate-600">{t("nextLesson")}{isGuardian ? ` · ${name.get(next.studentId)}` : ""}</div>
          <div className="mt-1 text-xl font-extrabold">{fmtDate(next.startsAt, tz, loc)} · {fmtTime(next.startsAt, tz)}</div>
          <div className="mb-3 text-sm text-slate-600">{t("withTeacher", { name: next.teacherName })} · {t("minutes", { n: next.minutes })}</div>
          <JoinButton url={next.joinUrl} {...join} />
        </section>
      )}

      <section className="card mb-6">
        <h2 className="mb-1 font-bold">{t("upcoming")}</h2>
        <p className="mb-3 text-xs text-slate-500">
          {t("excusePolicy", { h: s.freeCancelHours })}
        </p>
        {upcoming.length === 0 ? <Empty>{t("noUpcoming")}</Empty> : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((l) => {
              const hoursLeft = (l.startsAt.getTime() - now.getTime()) / 3_600_000;
              return (
                <li key={`${l.id}-${l.studentId}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <div className="font-semibold">
                      {fmtDate(l.startsAt, tz, loc)} · {fmtTime(l.startsAt, tz)}
                      {isGuardian && <span className="font-normal text-slate-600"> · {name.get(l.studentId)}</span>}
                    </div>
                    <div className="text-xs text-slate-500">{t("withTeacher", { name: l.teacherName })}{l.originalStartsAt ? ` · ${t("moved")}` : ""}</div>
                  </div>
                  {l.status === "cancelled" ? <Badge tone="red">{t("cancelled")}</Badge>
                    : l.attendance ? (
                      <Badge tone={l.attendance.state === "excused" ? "gray" : "green"}>
                        {t(`att_${l.attendance.state}`)} · {l.attendance.deducted ? t("deducted") : t("notDeducted")}
                      </Badge>
                    )
                    : hoursLeft > 0 ? (
                      <ActionForm
                        action={excuseAction.bind(null, l.id, l.studentId)}
                        submit={t("excuse")}
                        pendingLabel={t("pending")}
                        submitClass="btn-outline btn-sm"
                        className="[&>div]:mt-0"
                        confirm={hoursLeft >= s.freeCancelHours
                          ? t("excuseConfirmFree")
                          : t("excuseConfirmLate", { h: s.freeCancelHours })}
                      >{null}</ActionForm>
                    ) : <JoinButton url={l.joinUrl} small {...join} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-bold">{t("recentLessons")}</h2>
          {recent.length === 0 ? <Empty>{t("noRecent")}</Empty> : (
            <table className="table">
              <tbody>
                {recent.map((r) => (
                  <tr key={r.a.id}>
                    <td className="whitespace-nowrap">{fmtDate(r.startsAt, tz, loc)}</td>
                    {isGuardian && <td>{name.get(r.studentId)}</td>}
                    <td>{t(`att_${r.a.state}`)}{r.a.note && <div dir="auto" className="text-xs text-slate-500">{r.a.note}</div>}</td>
                    <td className="text-end text-xs text-slate-500">{r.a.deducted ? t("deducted") : t("notDeducted")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="card">
          <h2 className="mb-3 font-bold">{t("payments")}</h2>
          {payments.length === 0 ? <Empty>{t("noPayments")}</Empty> : (
            <table className="table">
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap">{p.paidOn}</td>
                    <td className="ltr whitespace-nowrap">{lang === "ar" ? fmtMoney(p.amount, p.currency) : fmtMoney(p.amount, p.currency).replace("ج.م", "EGP")}</td>
                    <td className="whitespace-nowrap">{t("lessonsAdded", { n: p.lessonsCredited })}</td>
                    <td className="hidden text-end text-xs text-slate-500 ltr sm:table-cell">{p.receiptNo}</td>
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
