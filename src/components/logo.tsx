/**
 * The academy mark: three overlapping circles (nations meeting). Colours come
 * from the brand variables in globals.css. The white ring keeps the navy
 * circle visible on dark backgrounds.
 */
export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden>
      <circle cx="72" cy="76" r="54" fill="var(--sky)" />
      <circle cx="128" cy="76" r="54" fill="var(--brand)" fillOpacity="0.92" />
      <circle cx="100" cy="126" r="54" fill="var(--sidebar)" stroke="#fff" strokeWidth="7" />
    </svg>
  );
}
