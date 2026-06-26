import { Link } from "react-router-dom";
import { Alert, Button } from "@heroui/react";
import { useAuth } from "../context/AuthContext.js";

export function ConnectionBanner() {
  const { connection, pendingSales, failedSales, sync } = useAuth();

  if (connection === "online" && pendingSales === 0 && failedSales === 0) return null;

  const status =
    connection === "offline"
      ? "warning"
      : failedSales > 0
        ? "danger"
        : connection === "syncing"
          ? "accent"
          : "success";

  let text: string;
  if (connection === "offline") {
    text = "Modo sin conexión — las ventas se guardan localmente hasta sincronizar.";
  } else if (connection === "syncing") {
    text = "Sincronizando con el servidor…";
  } else if (failedSales > 0 && pendingSales > 0) {
    text = `${pendingSales} venta(s) pendiente(s) y ${failedSales} con error de sincronización.`;
  } else if (failedSales > 0) {
    text = `${failedSales} venta(s) no se pudieron sincronizar. Revisa la cola de sincronización.`;
  } else {
    text = `${pendingSales} venta(s) pendiente(s) de sincronizar.`;
  }

  const hasQueue = pendingSales > 0 || failedSales > 0;

  return (
    <div className={`fortino-connection-strip fortino-connection-strip--${status === "danger" ? "error" : status === "accent" ? "info" : status}`}>
      <Alert status={status} className="flex-1 border-0 bg-transparent shadow-none">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Estado de conexión</Alert.Title>
          <Alert.Description>{text}</Alert.Description>
        </Alert.Content>
      </Alert>
      {hasQueue && (
        <Link
          to="/sincronizacion"
          className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-default-100"
        >
          Ver cola
        </Link>
      )}
      {connection === "online" && hasQueue && (
        <Button variant="primary" size="sm" onPress={() => sync()}>
          Sincronizar ahora
        </Button>
      )}
    </div>
  );
}
