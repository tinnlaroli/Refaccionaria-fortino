import { Link } from "react-router-dom";
import { Alert, Button } from "@heroui/react";
import { useShiftStatus } from "../../hooks/useShiftStatus.js";
import { useOnline } from "../../hooks/useOnline.js";

export function PosShiftBanner() {
  const online = useOnline();
  const { hasShift, loading } = useShiftStatus();

  if (loading || hasShift) return null;

  return (
    <div className="fortino-shift-banner flex flex-wrap items-center gap-3 border-b border-divider px-4 py-2">
      <Alert status="warning" className="flex-1 border-0 bg-transparent shadow-none">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Sin turno de caja abierto</Alert.Title>
          <Alert.Description>
            {online
              ? "Abre turno en Caja antes de cobrar. Las ventas en línea requieren turno activo."
              : "Abre turno cuando haya conexión. Puedes guardar ventas offline con turno cacheado."}
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <Link to="/caja">
        <Button variant="primary" size="sm">
          Ir a Caja
        </Button>
      </Link>
    </div>
  );
}
