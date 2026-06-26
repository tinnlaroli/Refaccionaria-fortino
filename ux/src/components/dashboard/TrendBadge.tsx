import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { TrendDelta } from "../../lib/dashboardFormat.js";

type Props = {
  delta: TrendDelta;
  className?: string;
};

export function TrendBadge({ delta, className }: Props) {
  const { pct, label } = delta;

  if (pct === null) {
    return (
      <span className={`fortino-trend-badge fortino-trend-badge--neutral ${className ?? ""}`.trim()}>
        <Minus size={14} aria-hidden />
        <span>Sin datos previos</span>
      </span>
    );
  }

  const tone =
    pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;

  return (
    <span
      className={`fortino-trend-badge fortino-trend-badge--${tone} ${className ?? ""}`.trim()}
      title={label}
    >
      <Icon size={14} aria-hidden />
      <span>
        {pct > 0 ? "+" : ""}
        {pct}% {label}
      </span>
    </span>
  );
}
