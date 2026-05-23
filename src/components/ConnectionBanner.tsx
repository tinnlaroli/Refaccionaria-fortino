import { useAuth } from "../context/AuthContext.js";

export function ConnectionBanner() {
  const { connection, pendingSales, sync } = useAuth();

  if (connection === "online" && pendingSales === 0) return null;

  const messages = {
    offline: {
      text: "Modo offline — las ventas se guardan localmente",
      action: null,
    },
    syncing: {
      text: "Sincronizando con el servidor...",
      action: null,
    },
    online: {
      text: `${pendingSales} venta(s) pendiente(s) de sincronizar`,
      action: "Sincronizar ahora",
    },
  };

  const msg =
    connection === "offline"
      ? messages.offline
      : connection === "syncing"
        ? messages.syncing
        : messages.online;

  return (
    <div
      className="connection-banner"
      role="status"
      style={{
        padding: "0.5rem 1rem",
        background:
          connection === "offline"
            ? "var(--warning)"
            : connection === "syncing"
              ? "var(--accent)"
              : "var(--success)",
        color: "#1c1917",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        fontSize: "0.875rem",
        fontWeight: 600,
      }}
    >
      <span>{msg.text}</span>
      {msg.action && (
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
          onClick={() => sync()}
        >
          {msg.action}
        </button>
      )}
    </div>
  );
}
