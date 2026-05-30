import type { ReactNode } from "react";
import {
  ChartLine,
  Folder,
  InventoryManagement,
  Percentage,
  UserMultiple,
  Wallet,
} from "@carbon/icons-react";
import type { DashboardSummary } from "../../api/dashboard.js";

export type DashboardKpi = {
  key: string;
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "success" | "warning" | "error" | "info";
  icon: ReactNode;
  to?: string;
};

const KPI_ORDER = ["sales", "active", "critical", "shifts", "health", "categories", "team"] as const;

export function buildDashboardKpis(summary: DashboardSummary): DashboardKpi[] {
  const { meta } = summary;
  const pool = new Map<string, DashboardKpi>();

  if (meta.canViewSales && summary.salesToday) {
    const { total, count } = summary.salesToday;
    const avg = count > 0 ? total / count : 0;
    pool.set("sales", {
      key: "sales",
      label: "Ventas de hoy",
      value: `$${total.toFixed(2)}`,
      hint:
        count > 0
          ? `${count} operación${count === 1 ? "" : "es"} · ticket $${avg.toFixed(2)}`
          : "Sin ventas registradas hoy",
      tone: count > 0 ? "info" : "default",
      icon: <ChartLine size={22} />,
      to: "/app/ventas",
    });
  }

  if (meta.canViewProducts && summary.products) {
    const p = summary.products;
    pool.set("active", {
      key: "active",
      label: "Catálogo activo",
      value: p.active,
      hint: `${p.total} piezas registradas`,
      tone: "default",
      icon: <InventoryManagement size={22} />,
      to: "/app/productos",
    });

    const critical = p.lowStock + p.outOfStock;
    pool.set("critical", {
      key: "critical",
      label: "Stock crítico",
      value: critical,
      hint:
        critical === 0
          ? "Inventario en orden"
          : `${p.outOfStock} agotadas · ${p.lowStock} bajas`,
      tone: p.outOfStock > 0 ? "error" : p.lowStock > 0 ? "warning" : "success",
      icon: <InventoryManagement size={22} />,
      to: "/app/inventario?bajo=1",
    });

    const healthPct = p.active > 0 ? Math.round((p.healthy / p.active) * 100) : 100;
    pool.set("health", {
      key: "health",
      label: "Salud de stock",
      value: `${healthPct}%`,
      hint: `${p.healthy} piezas sobre el mínimo`,
      tone: healthPct >= 90 ? "success" : healthPct >= 70 ? "warning" : "error",
      icon: <Percentage size={22} />,
      to: "/app/inventario",
    });
  }

  if (summary.categories != null && meta.canViewProducts) {
    pool.set("categories", {
      key: "categories",
      label: "Categorías",
      value: summary.categories,
      hint: "Grupos en catálogo",
      icon: <Folder size={22} />,
      to: "/app/categorias",
    });
  }

  if (summary.cash) {
    pool.set("shifts", {
      key: "shifts",
      label: "Cajas abiertas",
      value: summary.cash.openShifts,
      hint: summary.cash.openShifts > 0 ? "Turnos en operación" : "Ningún turno activo",
      tone: summary.cash.openShifts > 0 ? "success" : "default",
      icon: <Wallet size={22} />,
      to: "/caja",
    });
  }

  if (meta.canManageUsers && summary.users) {
    pool.set("team", {
      key: "team",
      label: "Equipo activo",
      value: summary.users.active,
      hint: `${summary.users.total} usuarios registrados`,
      icon: <UserMultiple size={22} />,
      to: "/app/empleados",
    });
  }

  const selected: DashboardKpi[] = [];
  for (const key of KPI_ORDER) {
    const kpi = pool.get(key);
    if (kpi) selected.push(kpi);
    if (selected.length === 4) break;
  }

  return selected;
}

export function relativeSaleTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Hace un momento";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
