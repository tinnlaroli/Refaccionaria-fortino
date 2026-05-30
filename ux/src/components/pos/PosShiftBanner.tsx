import { Link } from "react-router-dom";
import { Button, InlineNotification } from "@carbon/react";
import { useShiftStatus } from "../../hooks/useShiftStatus.js";
import { useOnline } from "../../hooks/useOnline.js";

export function PosShiftBanner() {
  const online = useOnline();
  const { hasShift, loading } = useShiftStatus();

  if (loading || hasShift) return null;

  return (
    <div className="fortino-shift-banner">
      <InlineNotification
        kind="warning"
        lowContrast
        title="Sin turno de caja abierto"
        subtitle={
          online
            ? "Abre turno en Caja antes de cobrar. Las ventas en línea requieren turno activo."
            : "Abre turno cuando haya conexión. Puedes guardar ventas offline con turno cacheado."
        }
        hideCloseButton
      />
      <Button as={Link} to="/caja" kind="primary" size="sm">
        Ir a Caja
      </Button>
    </div>
  );
}
