/**
 * Shared formatters — keep money/date/etc. rendering identical across every
 * surface. Before importing a private formatMoney into a component, reach for
 * one of these instead.
 */

/**
 * Format cents → "$1,234.56" (default) or "$1,234" (whole dollars when
 * `compact: true` or the amount is an exact dollar).
 *
 * We always show a thousands separator. We always use `$` because we're
 * single-currency for MVP.
 */
export function formatMoney(
  cents: number,
  opts?: { compact?: boolean }
): string {
  const dollars = cents / 100;
  const fractionDigits =
    opts?.compact || Number.isInteger(dollars) ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(dollars);
}

/**
 * Short money form for dense stat tiles, e.g. "$4k" / "$1.2k" / "$12m".
 * Falls back to formatMoney when the number is too small to abbreviate cleanly.
 */
export function formatMoneyShort(cents: number): string {
  const dollars = cents / 100;
  const abs = Math.abs(dollars);
  if (abs < 1000) {
    return formatMoney(cents, { compact: true });
  }
  if (abs < 1_000_000) {
    const k = dollars / 1000;
    return `$${k.toFixed(k >= 10 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  const m = dollars / 1_000_000;
  return `$${m.toFixed(m >= 10 ? 0 : 1).replace(/\.0$/, "")}m`;
}
