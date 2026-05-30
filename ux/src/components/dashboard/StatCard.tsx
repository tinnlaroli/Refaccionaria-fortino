import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "@carbon/icons-react";
import { Tile } from "@carbon/react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "error" | "info";
  icon?: ReactNode;
  to?: string;
};

const TONE_CLASS: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "",
  success: "fortino-stat-card--success",
  warning: "fortino-stat-card--warning",
  error: "fortino-stat-card--error",
  info: "fortino-stat-card--info",
};

export function StatCard({ label, value, hint, tone = "default", icon, to }: StatCardProps) {
  const body = (
    <Tile className={`fortino-stat-card ${TONE_CLASS[tone]}`}>
      <div className="fortino-stat-card__head">
        <span className="fortino-stat-card__label">{label}</span>
        {icon && <span className="fortino-stat-card__icon">{icon}</span>}
      </div>
      <strong className="fortino-stat-card__value">{value}</strong>
      {hint && <span className="fortino-stat-card__hint">{hint}</span>}
      {to && (
        <span className="fortino-stat-card__link-hint" aria-hidden>
          Ver detalle <ArrowUpRight size={14} />
        </span>
      )}
    </Tile>
  );

  if (to) {
    return (
      <Link to={to} className="fortino-tile-link fortino-stat-card-link">
        {body}
      </Link>
    );
  }

  return body;
}
