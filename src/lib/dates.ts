/**
 * Date-only strings, handled in local time.
 *
 * `new Date("2026-08-07")` is parsed as UTC midnight per spec, while
 * `new Date(2026, 7, 7)` is local midnight. East of Greenwich the UTC reading
 * lands hours into the following local day, which is enough to push a
 * `Math.ceil` day count up by one — "9 days left" renders as "10 days left".
 * Every comparison against a `targetDate` goes through here.
 */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Local `YYYY-MM-DD`, the inverse of parseLocalDate. */
export function toLocalISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}
