import { Navigate } from "react-router-dom";
import { InlineLoading } from "@carbon/react";
import { useAuth } from "../context/AuthContext.js";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
        <InlineLoading description="Verificando sesión…" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
