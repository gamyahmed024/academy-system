import Link from "next/link";
import { DateTime } from "luxon";
import { getDb } from "@/db";
import { requireStaff } from "@/server/session";
import { listLessons } from "@/server/services/schedule";
import { listTeachers } from "@/server/services/people";
import { getSettings } from "@/server/services/money";
import { weekBounds, fmtTime, inZone, AR } from "@/lib/domain/time";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "الجدول" };

// one colour per teacher, cycling
const COLORS = ["bg-brand", "bg-blue-700", "bg-accent", "bg-purple-700", "bg-rose-700", "bg-emerald-700", "bg-slate-700"];

export default async function Schedule(props: PageProps<"/schedule">) {
  await requireStaff();
  const sp = await props.searchParams;
  const db = getDb();
  const s = await getSettings(db);
  const tz = s.academyTimezone;
  const weekParam = typeof sp.week === "string" ? DateTime.fromISO(sp.week, { zone: tz }) : null;
  const ref = weekParam?.isValid ? weekParam.toJSDate() : new Date();
  const teacherId = typeof sp.teacher === "string" && sp.teacher ? Number(sp.teacher) : undefined;
  const { start, end, days } = weekBounds(ref, tz);
  const [lessons, teachers] = await Promise.all([
    listLessons(db, { from: start, to: end, teacherId, includeCancelled: true }),
    listTeachers(db),
  ]);
  const color = new Map(teachers.map((t, i) => [t.id, COLORS[i % COLORS.length]]));
  const todayIso = inZone(new Date(), tz).toISODate();
  const link = (w: DateTime) => `/schedule?${new URLSearchParams({ week: w.toISODate()!, ...(teacherId ? { teacher: String(teacherId) } : {}) })}`;
  const active = lessons.filter((l) => l.status !== "cancelled");

  return (
    <div>
      <PageHeader
        title={`جدول الأسبوع · ${days[0].setLocale(AR).toFormat("d LLLL")} – ${days[6].setLocale(AR).toFormat("d LLLL")}`}
        subtitle={`${active.length} حصة · المواعيد بتوقيت مصر`}
        actions={
          <>
            <Link href={link(days[0].minus({ weeks: 1 }))} className="btn-outline">→ اللي فات</Link>
            <Link href={link(DateTime.now().setZone(tz))} className="btn-outline">النهارده</Link>
            <Link href={link(days[0].plus({ weeks: 1 }))} className="btn-outline">الجاي ←</Link>
            <Link href="/lessons/new?mode=series" className="btn">+ حصص متكررة</Link>
          </>
        }
      />
      <form className="mb-4 flex gap-2">
        <input type="hidden" name="week" value={days[0].toISODate()!} />
        <select name="teacher" defaultValue={teacherId ?? ""} className="input max-w-xs">
          <option value="">كل المدرسين</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button className="btn-outline">عرض</button>
      </form>

      <div className="grid gap-2 overflow-x-auto md:grid-cols-7">
        {days.map((d) => {
          const iso = d.toISODate();
          const items = lessons.filter((l) => inZone(l.startsAt, tz).toISODate() === iso);
          return (
            <div key={iso} className={`min-h-40 rounded-xl border bg-white p-2 ${iso === todayIso ? "border-brand ring-2 ring-brand/20" : "border-slate-200"}`}>
              <div className="mb-2 text-center text-sm font-bold">
                {d.setLocale(AR).toFormat("cccc")}
                <span className="block text-xs font-normal text-slate-500">{d.setLocale(AR).toFormat("d LLLL")}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((l) => (
                  <Link
                    key={l.id}
                    href={`/lessons/${l.id}`}
                    className={`block rounded-lg px-2 py-1.5 text-xs text-white ${color.get(l.teacherId)} ${l.status === "cancelled" ? "line-through opacity-40" : ""}`}
                  >
                    <div className="font-bold">{fmtTime(l.startsAt, tz)} · {l.title}</div>
                    <div className="opacity-90">
                      {l.teacherName}
                      {l.recorded > 0 && " · ✓"}
                      {l.originalStartsAt && " · اتنقلت"}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        {teachers.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${color.get(t.id)}`} /> {t.name}</span>
        ))}
        <span>✓ = اتسجل الحضور</span>
      </div>
    </div>
  );
}
