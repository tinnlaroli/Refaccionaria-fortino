import { useAuth } from "../context/AuthContext.js";
import { InlineNotification, Button } from "@carbon/react";

export function ConnectionBanner() {
  const { connection, pendingSales, failedSales, sync } = useAuth();

  if (connection === "online" && pendingSales === 0 && failedSales === 0) return null;

  const kind =
    connection === "offline"
      ? "warning"
      : failedSales > 0
        ? "error"
        : connection === "syncing"
          ? "info"
          : "success";

  let text: string;
  if (connection === "offline") {
    text = "Modo sin conexión — las ventas se guardan localmente hasta sincronizar.";
  } else if (connection === "syncing") {
    text = "Sincronizando con el servidor…";
  } else if (failedSales > 0 && pendingSales > 0) {
    text = `${pendingSales} venta(s) pendiente(s) y ${failedSales} con error de sincronización.`;
  } else if (failedSales > 0) {
    text = `${failedSales} venta(s) no se pudieron sincronizar. Revisa Caja o contacta soporte.`;
  } else {
    text = `${pendingSales} venta(s) pendiente(s) de sincronizar.`;
  }

  return (
    <div className={`fortino-connection-strip fortino-connection-strip--${kind}`}>
      <InlineNotification
        kind={kind === "error" ? "error" : kind}
        lowContrast
        title="Estado de conexión"
        subtitle={text}
        hideCloseButton
      />
      {connection === "online" && (pendingSales > 0 || failedSales > 0) && (
        <Button kind="primary" size="sm" onClick={() => sync()}>
          Sincronizar ahora
        </Button>
      )}
    </div>
  );
}
