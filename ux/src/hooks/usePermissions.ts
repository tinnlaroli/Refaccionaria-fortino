import { useAuth } from "../context/AuthContext.js";

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

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    canAccessAdmin,
    isAdmin: user?.role === "admin",
  };
}
