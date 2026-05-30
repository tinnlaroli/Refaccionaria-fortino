import { useMemo } from "react";
import { useAuth } from "../context/AuthContext.js";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  cashier: "Cajero",
  viewer: "Consulta",
};

export function usePermissions() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];

  const hasPermission = (key: string) => permissions.includes(key);
  const hasAnyPermission = (...keys: string[]) =>
    keys.some((key) => permissions.includes(key));

  const canAccessAdmin = hasAnyPermission(
    "products.view",
    "products.create",
    "products.edit",
    "users.manage",
    "sales.view_all",
  );

  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? "Usuario";

  const dashboardAccess = useMemo(
    () => ({
      products: permissions.includes("products.view"),
      sales: permissions.includes("sales.view_all"),
      users: permissions.includes("users.manage"),
      createProducts: permissions.includes("products.create"),
      editProducts: permissions.includes("products.edit"),
    }),
    [user?.permissions],
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    canAccessAdmin,
    isAdmin: user?.role === "admin",
    isCashier: user?.role === "cashier",
    roleLabel,
    dashboardAccess,
  };
}