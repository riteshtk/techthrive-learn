const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-11-17" → "17 Nov 2026", independent of the build machine's locale. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = m === undefined ? undefined : MONTHS[m - 1];
  return y && month && d ? `${d} ${month} ${y}` : iso;
}
