export type TrendDelta = {
  /** Porcentaje vs periodo anterior (ej. vs ayer). */
  pct: number | null;
  label: string;
};

export function calcTrendPct(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function formatMoney(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function formatCompactMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `$${(value / 1_000).toFixed(1)}k`;
  return formatMoney(value);
}
