import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { requireRole } from "@/server/session";
import { getT } from "@/server/lang";
import { getLesson } from "@/server/services/schedule";
import { teacherOf } from "@/server/services/portal";
import type { AttendanceState } from "@/lib/domain/rules";
import { fmtDateTime, timezoneLabel } from "@/lib/domain/time";
import { dateLocale, dirOf, zoneLabel } from "@/lib/i18n";
import { ActionForm } from "@/components/action-form";
import { PageHeader, BackLink, Badge, JoinButton } from "@/components/ui";
import { teacherAttendanceAction } from "../../actions";

const STATES: AttendanceState[] = ["present", "late", "absent", "teacher_cancelled"];

export default async function TeacherLesson(props: PageProps<"/my/lessons/[id]">) {
  const user = await requireRole("teacher");
  const db = getDb();
  const { lang, t } = await getT();
  const teacher = await teacherOf(db, user);
  const id = Number((await props.params).id);
  const l = teacher && Number.isInteger(id) ? await getLesson(db, id) : null;
  // a teacher only ever sees their own lessons
  if (!teacher || !l || l.teacherId !== teacher.id) notFound();
  const tz = teacher.timezone;
  const started = l.startsAt <= new Date();

  return (
    <div>
      <BackLink href="/my" ltr={dirOf(lang) === "ltr"}>{t("home")}</BackLink>
      <PageHeader
        title={l.title}
        subtitle={`${fmtDateTime(l.startsAt, tz, dateLocale(lang))} (${zoneLabel(lang, tz, timezoneLabel)}) · ${t("minutes", { n: l.minutes })}`}
        actions={<JoinButton url={l.joinUrl} label={t("joinLesson")} noLink={t("noLink")} />}
      />
      {l.status === "cancelled" && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{t("lessonCancelled")}{l.cancelReason ? `: ${l.cancelReason}` : ""}.</p>}
      {!started && <p className="mb-4 rounded-lg bg-brand-soft p-3 text-sm text-brand">{t("notStarted")}</p>}
      <div className="space-y-4">
        {l.participants.map((p) => {
          const cur = l.attendance.find((a) => a.studentId === p.id);
          return (
            <section key={p.id} className="card">
              <h2 className="mb-3 flex flex-wrap items-center gap-2 font-bold">
                {p.name}
                {cur && <Badge tone={cur.state === "present" ? "green" : "gray"}>{t(`att_${cur.state}`)}</Badge>}
              </h2>
              {cur?.state === "excused" ? (
                <p className="text-sm text-slate-600">{t("studentExcused")}</p>
              ) : (
                <ActionForm action={teacherAttendanceAction.bind(null, l.id, p.id)} submit={t("save")} pendingLabel={t("pending")}>
                  <div className="flex flex-wrap gap-2">
                    {STATES.filter((st) => started || st === "teacher_cancelled").map((st) => (
                      <label key={st} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                        <input type="radio" name="state" value={st} required defaultChecked={cur?.state === st} /> {t(`att_${st}`)}
                      </label>
                    ))}
                  </div>
                  <label className="mt-3 block">
                    <span className="label">{t("noteHomework")}</span>
                    <input name="note" defaultValue={cur?.note ?? ""} className="input" />
                  </label>
                </ActionForm>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
