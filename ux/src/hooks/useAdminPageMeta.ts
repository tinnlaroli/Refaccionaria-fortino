import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ADMIN_MODULES } from "../config/modules.js";

const PAGE_META: Record<string, { title: string; description: string; step?: string }> = {
  "/app": {
    title: "Panel de control",
    description: "Resumen del día y accesos rápidos a tu refaccionaria.",
    step: "1 · Inicio",
  },
  "/app/productos": {
    title: "Productos",
    description: "Administra piezas, precios y existencias del catálogo.",
    step: "2 · Catálogo",
  },
  "/app/categorias": {
    title: "Categorías",
    description: "Organiza el catálogo por tipo de refacción.",
    step: "2 · Catálogo",
  },
  "/app/inventario": {
    title: "Inventario",
    description: "Revisa existencias, alertas y ajusta stock.",
    step: "3 · Existencias",
  },
  "/app/movimientos": {
    title: "Movimientos",
    description: "Historial de ajustes, ventas y auditoría.",
    step: "4 · Historial",
  },
  "/app/ventas": {
    title: "Ventas",
    description: "Consulta, filtra y exporta operaciones de caja.",
    step: "4 · Historial",
  },
  "/app/empleados": {
    title: "Empleados",
    description: "Personal con acceso al POS y al panel.",
    step: "5 · Equipo",
  },
};

export function useAdminPageMeta() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const meta = PAGE_META[pathname];
    if (meta) return meta;

    const mod = ADMIN_MODULES.find((m) => m.path === pathname);
    return {
      title: mod?.label ?? "Panel",
      description: mod?.description ?? "",
    };
  }, [pathname]);
}
