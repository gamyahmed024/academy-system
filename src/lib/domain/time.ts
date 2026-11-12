import { DateTime } from "luxon";

/** Arabic month/day names with Latin digits, to match times and amounts. */
export const AR = "ar-EG-u-nu-latn";

/** ISO weekday: 1 = Monday ... 7 = Sunday (same as luxon). */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS_AR: Record<number, string> = {
  6: "السبت",
  7: "الأحد",
  1: "الاتنين",
  2: "التلات",
  3: "الأربع",
  4: "الخميس",
  5: "الجمعة",
};

/** Week order used in the UI (Egyptian week starts on Saturday). */
export const WEEK_ORDER: IsoWeekday[] = [6, 7, 1, 2, 3, 4, 5];

export function isValidTimezone(tz: string): boolean {
  return DateTime.now().setZone(tz).isValid;
}

/**
 * Expand a weekly recurrence into concrete instants.
 * The wall-clock time is anchored to `timezone`, so a lesson at 10:00 Berlin
 * stays at 10:00 Berlin across daylight-saving changes; its UTC instant moves.
 * Dates are inclusive, given as "YYYY-MM-DD" in the anchor timezone.
 */
export function expandWeekly(opts: {
  weekdays: number[];
  localTime: string;
  timezone: string;
  startDate: string;
  endDate: string;
}): Date[] {
  const [h, m] = opts.localTime.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`invalid time ${opts.localTime}`);
  }
  if (!isValidTimezone(opts.timezone)) throw new Error(`invalid timezone ${opts.timezone}`);
  const days = new Set(opts.weekdays);
  let d = DateTime.fromISO(opts.startDate, { zone: opts.timezone }).startOf("day");
  const end = DateTime.fromISO(opts.endDate, { zone: opts.timezone }).startOf("day");
  if (!d.isValid || !end.isValid) throw new Error("invalid date range");
  const out: Date[] = [];
  while (d <= end) {
    if (days.has(d.weekday)) {
      const at = d.set({ hour: h, minute: m, second: 0, millisecond: 0 });
      out.push(at.toUTC().toJSDate());
    }
    d = d.plus({ days: 1 });
  }
  return out;
}

/** Wall-clock date+time in a timezone → UTC Date. */
export function zonedToUtc(dateIso: string, time: string, timezone: string): Date {
  const dt = DateTime.fromISO(`${dateIso}T${time}`, { zone: timezone });
  if (!dt.isValid) throw new Error(`invalid date/time ${dateIso} ${time}`);
  return dt.toUTC().toJSDate();
}

export function inZone(d: Date, timezone: string): DateTime {
  return DateTime.fromJSDate(d).setZone(timezone);
}

export function fmtTime(d: Date, timezone: string): string {
  return inZone(d, timezone).toFormat("HH:mm");
}

export function fmtDate(d: Date, timezone: string): string {
  return inZone(d, timezone).setLocale(AR).toFormat("cccc d LLLL");
}

export function fmtDateTime(d: Date, timezone: string): string {
  return `${fmtDate(d, timezone)} · ${fmtTime(d, timezone)}`;
}

/** "YYYY-MM" month key of an instant, in a timezone. */
export function monthKey(d: Date, timezone: string): string {
  return inZone(d, timezone).toFormat("yyyy-MM");
}

/** UTC bounds [start, end) of a "YYYY-MM" month in a timezone. */
export function monthBounds(month: string, timezone: string): { start: Date; end: Date } {
  const start = DateTime.fromISO(`${month}-01`, { zone: timezone }).startOf("month");
  if (!start.isValid) throw new Error(`invalid month ${month}`);
  return { start: start.toUTC().toJSDate(), end: start.plus({ months: 1 }).toUTC().toJSDate() };
}

/** UTC bounds of the local day containing `d`. */
export function dayBounds(d: Date, timezone: string): { start: Date; end: Date } {
  const s = inZone(d, timezone).startOf("day");
  return { start: s.toUTC().toJSDate(), end: s.plus({ days: 1 }).toUTC().toJSDate() };
}

/** UTC bounds of the Saturday-starting week containing `d`. */
export function weekBounds(d: Date, timezone: string): { start: Date; end: Date; days: DateTime[] } {
  const local = inZone(d, timezone).startOf("day");
  const back = (local.weekday - 6 + 7) % 7; // days since Saturday
  const s = local.minus({ days: back });
  const days = Array.from({ length: 7 }, (_, i) => s.plus({ days: i }));
  return { start: s.toUTC().toJSDate(), end: s.plus({ days: 7 }).toUTC().toJSDate(), days };
}

export function overlaps(aStart: Date, aMinutes: number, bStart: Date, bMinutes: number): boolean {
  const aEnd = aStart.getTime() + aMinutes * 60_000;
  const bEnd = bStart.getTime() + bMinutes * 60_000;
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}

/** A short list of zones that cover most students; any IANA zone is accepted. */
export const COMMON_TIMEZONES: { tz: string; label: string }[] = [
  { tz: "Africa/Cairo", label: "مصر (القاهرة)" },
  { tz: "Europe/London", label: "بريطانيا (لندن)" },
  { tz: "Europe/Berlin", label: "ألمانيا (برلين)" },
  { tz: "Europe/Paris", label: "فرنسا (باريس)" },
  { tz: "Europe/Madrid", label: "إسبانيا (مدريد)" },
  { tz: "Europe/Amsterdam", label: "هولندا" },
  { tz: "Europe/Stockholm", label: "السويد" },
  { tz: "Europe/Istanbul", label: "تركيا" },
  { tz: "Asia/Riyadh", label: "السعودية" },
  { tz: "Asia/Dubai", label: "الإمارات" },
  { tz: "Asia/Karachi", label: "باكستان" },
  { tz: "Asia/Kuala_Lumpur", label: "ماليزيا" },
  { tz: "Asia/Jakarta", label: "إندونيسيا (جاكرتا)" },
  { tz: "Asia/Tokyo", label: "اليابان" },
  { tz: "Asia/Seoul", label: "كوريا" },
  { tz: "Australia/Sydney", label: "أستراليا (سيدني)" },
  { tz: "America/New_York", label: "أمريكا (نيويورك)" },
  { tz: "America/Chicago", label: "أمريكا (شيكاغو)" },
  { tz: "America/Los_Angeles", label: "أمريكا (لوس أنجلوس)" },
  { tz: "America/Toronto", label: "كندا (تورنتو)" },
];

export function timezoneLabel(tz: string): string {
  return COMMON_TIMEZONES.find((z) => z.tz === tz)?.label ?? tz;
}
