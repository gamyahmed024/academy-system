import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { payouts } from "@/db/schema";
import type { CurrentUser } from "@/server/session";
import { getT } from "@/server/lang";
import { teacherOf } from "@/server/services/portal";
import { listLessons } from "@/server/services/schedule";
import { getSettings, teacherMonthPay } from "@/server/services/money";
import { fmtMoney } from "@/lib/domain/rules";
import { fmtDate, fmtTime, monthKey, inZone, timezoneLabel } from "@/lib/domain/time";
import { dateLocale, zoneLabel } from "@/lib/i18n";
import { PageHeader, Kpi, Empty, Badge, JoinButton } from "@/components/ui";

export async function TeacherHome({ user }: { user: CurrentUser }) {
  const db = getDb();
  const { lang, t } = await getT();
  const t0 = await teacherOf(db, user);
  if (!t0) return <Empty>{t("notLinked")}</Empty>;
  const teacher = t0;
  const s = await getSettings(db);
  const tz = teacher.timezone;
  const loc = dateLocale(lang);
  const egp = (v: string | number) => (lang === "ar" ? fmtMoney(v) : fmtMoney(v, "EGP").replace("ج.م", "EGP"));
  const now = new Date();
  const month = monthKey(now, s.academyTimezone);
  const today = inZone(now, tz).startOf("day");
  const [upcoming, past, nMonth, closed] = await Promise.all([
    listLessons(db, { from: today.toJSDate(), to: today.plus({ days: 8 }).toJSDate(), teacherId: teacher.id }),
    listLessons(db, { from: today.minus({ days: 14 }).toJSDate(), to: now, teacherId: teacher.id }),
    teacherMonthPay(db, teacher, month, s),
    db.select().from(payouts).where(eq(payouts.teacherId, teacher.id)).orderBy(desc(payouts.month)).limit(6),
  ]);
  const unrecorded = past.filter((l) => l.recorded === 0);
  const todayIso = today.toISODate();
  const todays = upcoming.filter((l) => inZone(l.startsAt, tz).toISODate() === todayIso);
  const join = { label: t("joinLesson"), noLink: t("noLink") };

  return (
    <div>
      <PageHeader title={t("hello", { name: teacher.name })} subtitle={t("timesIn", { zone: zoneLabel(lang, tz, timezoneLabel) })} />
      {!teacher.meetingUrl && <div className="mb-6 rounded-lg bg-accent-soft p-3 text-sm text-accent">{t("noMeetingLink")}</div>}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t("todayLessons")} value={todays.length} />
        <Kpi label={t("needRecording")} value={unrecorded.length} tone={unrecorded.length ? "red" : undefined} />
        <Kpi label={t("monthLessons")} value={nMonth.lessons} />
        <Kpi label={t("monthPay")} value={egp(nMonth.amountEgp)} />
      </div>

      {unrecorded.length > 0 && (
        <section className="card mb-6 border-red-200">
          <h2 className="mb-3 font-bold text-red-700">{t("recordThese")}</h2>
          <ul className="space-y-2">
            {unrecorded.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{fmtDate(l.startsAt, tz, loc)} · {fmtTime(l.startsAt, tz)} · {l.title}</span>
                <Link href={`/my/lessons/${l.id}`} className="btn btn-sm">{t("record")}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mb-6">
        <h2 className="mb-3 font-bold">{t("weekLessons")}</h2>
        {upcoming.length === 0 ? <Empty>{t("noLessons")}</Empty> : (
          <table className="table">
            <tbody>
              {upcoming.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap">
                    <Link href={`/my/lessons/${l.id}`} className="link">{fmtDate(l.startsAt, tz, loc)} · {fmtTime(l.startsAt, tz)}</Link>
                  </td>
                  <td>{l.title}{l.originalStartsAt && <span className="text-xs text-slate-500"> · {t("moved")}</span>}</td>
                  <td className="text-end">{l.recorded > 0 ? <Badge tone="green">{t("recorded")}</Badge> : <JoinButton url={l.joinUrl} small {...join} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 font-bold">{t("yourPay")}</h2>
        <p className="mb-3 text-sm text-slate-600">{t("payPerLesson", { amount: egp(teacher.payPerLessonEgp) })}</p>
        {closed.length === 0 ? <Empty>{t("noClosedMonths")}</Empty> : (
          <table className="table">
            <thead><tr><th>{t("month")}</th><th>{t("lessons")}</th><th>{t("amount")}</th><th>{t("paidOut")}</th></tr></thead>
            <tbody>
              {closed.map((p) => (
                <tr key={p.id}>
                  <td>{p.month}</td>
                  <td>{p.lessons}</td>
                  <td className="whitespace-nowrap">{egp(p.amountEgp)}</td>
                  <td>{p.paidOn ? <Badge tone="green">{t("paidOn", { date: p.paidOn })}</Badge> : <Badge tone="accent">{t("notYet")}</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
