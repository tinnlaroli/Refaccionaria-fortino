import { Navigate } from "react-router-dom";
import { Spinner } from "@heroui/react";
import { useAuth } from "../context/AuthContext.js";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" aria-label="Verificando sesión…" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
