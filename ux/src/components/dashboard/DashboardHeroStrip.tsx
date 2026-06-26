import type { ReactNode } from "react";
import { formatCompactMoney } from "../../lib/dashboardFormat.js";

type Props = {
  items: Array<{
    key: string;
    label: string;
    value: string;
    hint?: string;
    icon?: ReactNode;
  }>;
};

export function DashboardHeroStrip({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="fortino-dash-hero-strip" aria-label="Resumen rápido">
      {items.map((item) => (
        <div key={item.key} className="fortino-dash-hero-strip__item">
          {item.icon && <span className="fortino-dash-hero-strip__icon">{item.icon}</span>}
          <div className="fortino-dash-hero-strip__text">
            <span className="fortino-dash-hero-strip__label">{item.label}</span>
            <strong className="fortino-dash-hero-strip__value">{item.value}</strong>
            {item.hint && <span className="fortino-dash-hero-strip__hint">{item.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function formatHeroMoney(value: number) {
  return formatCompactMoney(value);
}
