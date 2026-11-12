import { COMMON_TIMEZONES } from "@/lib/domain/time";

export function TimezoneSelect({ name = "timezone", defaultValue = "Africa/Cairo" }: { name?: string; defaultValue?: string }) {
  const known = COMMON_TIMEZONES.some((z) => z.tz === defaultValue);
  return (
    <select name={name} defaultValue={defaultValue} className="input" required>
      {!known && <option value={defaultValue}>{defaultValue}</option>}
      {COMMON_TIMEZONES.map((z) => (
        <option key={z.tz} value={z.tz}>
          {z.label}
        </option>
      ))}
    </select>
  );
}
