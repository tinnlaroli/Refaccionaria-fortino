import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions.js";

type PermissionRouteProps = {
  permission?: string | string[];
  children: React.ReactNode;
};

export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  const { hasPermission, hasAnyPermission } = usePermissions();

  if (!permission) return <>{children}</>;

  const keys = Array.isArray(permission) ? permission : [permission];
  const allowed =
    keys.length === 1
      ? hasPermission(keys[0])
      : hasAnyPermission(...keys);

  if (!allowed) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
