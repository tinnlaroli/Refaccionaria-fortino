import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions.js";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { canAccessAdmin } = usePermissions();

  if (!canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
