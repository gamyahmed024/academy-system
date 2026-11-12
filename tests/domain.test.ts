import { describe, it, expect } from "vitest";
import { expandWeekly, fmtTime, monthKey, weekBounds, overlaps } from "@/lib/domain/time";
import { decideAttendance, convertToEgp, sumMoney, subMoney, mulMoney } from "@/lib/domain/rules";

const policy = { freeCancelHours: 24, payTeacherOnNoShow: true };

describe("weekly expansion and daylight saving", () => {
  it("keeps the student's wall-clock time across DST changes (Berlin, Oct 2026)", () => {
    const dates = expandWeekly({
      weekdays: [2, 4],
      localTime: "10:00",
      timezone: "Europe/Berlin",
      startDate: "2026-10-01",
      endDate: "2026-12-31",
    });
    expect(dates.length).toBe(27);
    expect(new Set(dates.map((d) => fmtTime(d, "Europe/Berlin")))).toEqual(new Set(["10:00"]));
    // teacher in Cairo sees 11:00, and 12:00 during the gap week (Oct 25–29)
    const cairo = dates.map((d) => fmtTime(d, "Africa/Cairo"));
    expect(new Set(cairo)).toEqual(new Set(["11:00", "12:00"]));
    expect(dates.filter((d) => fmtTime(d, "Africa/Cairo") === "12:00").map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-10-27",
      "2026-10-29",
    ]);
  });

  it("counts lessons per month (8-lesson package vs twice a week)", () => {
    const dates = expandWeekly({
      weekdays: [2, 4],
      localTime: "10:00",
      timezone: "Europe/Berlin",
      startDate: "2026-10-01",
      endDate: "2026-12-31",
    });
    const per: Record<string, number> = {};
    for (const d of dates) per[monthKey(d, "Europe/Berlin")] = (per[monthKey(d, "Europe/Berlin")] ?? 0) + 1;
    expect(per).toEqual({ "2026-10": 9, "2026-11": 8, "2026-12": 10 });
  });

  it("rejects bad input", () => {
    expect(() =>
      expandWeekly({ weekdays: [1], localTime: "25:00", timezone: "Africa/Cairo", startDate: "2026-01-01", endDate: "2026-01-31" }),
    ).toThrow();
    expect(() =>
      expandWeekly({ weekdays: [1], localTime: "10:00", timezone: "Mars/Base", startDate: "2026-01-01", endDate: "2026-01-31" }),
    ).toThrow();
  });

  it("weeks start on Saturday", () => {
    const { days } = weekBounds(new Date("2026-11-11T12:00:00Z"), "Africa/Cairo");
    expect(days[0].toISODate()).toBe("2026-11-07");
    expect(days[0].weekday).toBe(6);
  });

  it("detects overlaps", () => {
    const a = new Date("2026-11-01T10:00:00Z");
    expect(overlaps(a, 60, new Date("2026-11-01T10:30:00Z"), 60)).toBe(true);
    expect(overlaps(a, 60, new Date("2026-11-01T11:00:00Z"), 60)).toBe(false);
  });
});

describe("attendance policy", () => {
  const start = new Date("2026-11-10T10:00:00Z");
  it("excused with 30h notice is free", () => {
    expect(decideAttendance("excused", start, new Date("2026-11-09T04:00:00Z"), policy)).toEqual({ deducted: false, teacherPaid: false });
  });
  it("excused with 5h notice is deducted", () => {
    expect(decideAttendance("excused", start, new Date("2026-11-10T05:00:00Z"), policy)).toEqual({ deducted: true, teacherPaid: true });
  });
  it("no-show is deducted, teacher pay follows the setting", () => {
    expect(decideAttendance("absent", start, null, policy)).toEqual({ deducted: true, teacherPaid: true });
    expect(decideAttendance("absent", start, null, { ...policy, payTeacherOnNoShow: false })).toEqual({ deducted: true, teacherPaid: false });
  });
  it("teacher cancellation is never deducted", () => {
    expect(decideAttendance("teacher_cancelled", start, null, policy)).toEqual({ deducted: false, teacherPaid: false });
  });
});

describe("money", () => {
  it("converts exactly with half-up rounding", () => {
    expect(convertToEgp("120", "56")).toBe("6720.00");
    expect(convertToEgp("0.10", "0.333333")).toBe("0.03");
    expect(convertToEgp("20000", "0.33")).toBe("6600.00");
    expect(convertToEgp("19.99", "48.555")).toBe("970.61");
  });
  it("adds and subtracts without float error", () => {
    expect(sumMoney(["0.10", "0.20", "0.30"])).toBe("0.60");
    expect(subMoney("100.00", "250.50")).toBe("-150.50");
    expect(mulMoney("250.00", 3)).toBe("750.00");
  });
});
