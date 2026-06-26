import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import { ArrowUpRight } from "lucide-react";

import { Card } from "@heroui/react";

import { TrendBadge } from "./TrendBadge.js";

import type { TrendDelta } from "../../lib/dashboardFormat.js";



type StatCardProps = {

  label: string;

  value: string | number;

  hint?: string;

  tone?: "default" | "success" | "warning" | "error" | "info";

  icon?: ReactNode;

  to?: string;

  delta?: TrendDelta;

};



const TONE_CLASS: Record<NonNullable<StatCardProps["tone"]>, string> = {

  default: "",

  success: "fortino-stat-card--success",

  warning: "fortino-stat-card--warning",

  error: "fortino-stat-card--error",

  info: "fortino-stat-card--info",

};



export function StatCard({ label, value, hint, tone = "default", icon, to, delta }: StatCardProps) {

  const body = (

    <Card className={`fortino-stat-card ${TONE_CLASS[tone]}`}>

      <Card.Content>

        <div className="fortino-stat-card__head">

          <span className="fortino-stat-card__label">{label}</span>

          {icon && <span className="fortino-stat-card__icon">{icon}</span>}

        </div>

        <strong className="fortino-stat-card__value">{value}</strong>

        {delta && <TrendBadge delta={delta} className="fortino-stat-card__trend" />}

        {hint && <span className="fortino-stat-card__hint">{hint}</span>}

        {to && (

          <span className="fortino-stat-card__link-hint mt-2 flex items-center gap-1 text-xs text-primary" aria-hidden>

            Ver detalle <ArrowUpRight size={14} />

          </span>

        )}

      </Card.Content>

    </Card>

  );



  if (to) {

    return (

      <Link to={to} className="fortino-tile-link fortino-stat-card-link no-underline">

        {body}

      </Link>

    );

  }



  return body;

}

