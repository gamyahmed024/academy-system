/** Business rules that decide credits and teacher pay. Pure functions, unit-tested. */

export type AttendanceState = "present" | "late" | "absent" | "excused" | "teacher_cancelled";

export const ATTENDANCE_LABELS: Record<AttendanceState, string> = {
  present: "حضر",
  late: "اتأخر",
  absent: "غاب من غير اعتذار",
  excused: "اعتذر",
  teacher_cancelled: "المدرس لغى",
};

export type Policy = {
  /** an excuse given at least this many hours before the lesson is free */
  freeCancelHours: number;
  /** pay the teacher when the student does not show up without notice */
  payTeacherOnNoShow: boolean;
};

export function decideAttendance(
  state: AttendanceState,
  lessonStart: Date,
  noticeAt: Date | null,
  policy: Policy,
): { deducted: boolean; teacherPaid: boolean } {
  switch (state) {
    case "present":
    case "late":
      return { deducted: true, teacherPaid: true };
    case "absent":
      return { deducted: true, teacherPaid: policy.payTeacherOnNoShow };
    case "teacher_cancelled":
      return { deducted: false, teacherPaid: false };
    case "excused": {
      if (!noticeAt) return { deducted: true, teacherPaid: policy.payTeacherOnNoShow };
      const hours = (lessonStart.getTime() - noticeAt.getTime()) / 3_600_000;
      const free = hours >= policy.freeCancelHours;
      return { deducted: !free, teacherPaid: free ? false : policy.payTeacherOnNoShow };
    }
  }
}

/* ------------------------------ money ------------------------------ */

export const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED", "CAD", "AUD", "JPY"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<string, string> = {
  EGP: "جنيه مصري",
  USD: "دولار",
  EUR: "يورو",
  GBP: "استرليني",
  SAR: "ريال سعودي",
  AED: "درهم إماراتي",
  CAD: "دولار كندي",
  AUD: "دولار أسترالي",
  JPY: "ين ياباني",
};

/** Parse a decimal string to an integer number of `scale` minor units (no float error). */
export function toMinor(value: string, scale: number): bigint {
  const s = value.trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`invalid amount ${value}`);
  const [int, frac = ""] = s.split(".");
  const padded = (frac + "0".repeat(scale)).slice(0, scale);
  const rest = frac.slice(scale);
  let n = BigInt(int) * 10n ** BigInt(scale) + BigInt(padded || "0");
  if (rest && Number(rest[0]) >= 5) n += 1n; // round half up
  return n;
}

export function fromMinor(n: bigint, scale: number): string {
  const neg = n < 0n;
  const a = neg ? -n : n;
  const base = 10n ** BigInt(scale);
  const int = a / base;
  const frac = (a % base).toString().padStart(scale, "0");
  return `${neg ? "-" : ""}${int}${scale ? "." + frac : ""}`;
}

/** amount × rate, rounded half-up to 2 decimals, exact. */
export function convertToEgp(amount: string, rate: string): string {
  const a = toMinor(amount, 2); // 2 decimals
  const r = toMinor(rate, 6); // 6 decimals
  const prod = a * r; // 8 decimals
  const q = prod / 1_000_000n;
  const rem = prod % 1_000_000n;
  return fromMinor(rem * 2n >= 1_000_000n ? q + 1n : q, 2);
}

export function addMoney(a: string, b: string): string {
  return fromMinor(toMinor(a, 2) + toMinor(b, 2), 2);
}

export function sumMoney(values: string[]): string {
  return fromMinor(
    values.reduce((acc, v) => acc + toMinorSigned(v), 0n),
    2,
  );
}

function toMinorSigned(v: string): bigint {
  return v.startsWith("-") ? -toMinor(v.slice(1), 2) : toMinor(v, 2);
}

export function subMoney(a: string, b: string): string {
  return fromMinor(toMinorSigned(a) - toMinorSigned(b), 2);
}

export function mulMoney(a: string, times: number): string {
  return fromMinor(toMinorSigned(a) * BigInt(times), 2);
}

export function fmtMoney(v: string | number, currency = "EGP"): string {
  const n = typeof v === "number" ? v : Number(v);
  const s = n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return currency === "EGP" ? `${s} ج.م` : `${s} ${currency}`;
}
