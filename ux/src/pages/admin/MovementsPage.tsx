import { useEffect, useState } from "react";
import { fetchAuditLog, type AuditEntry } from "../../api/audit.js";
import { EmptyState } from "../../components/EmptyState.js";
import { useAuth } from "../../context/AuthContext.js";

const ACTION_LABELS: Record<string, string> = {
  "product.stock_adjust": "Ajuste de stock",
  "sale.create": "Venta registrada",
  "sale.cancel": "Venta cancelada",
  "product.create": "Producto creado",
  "product.update": "Producto actualizado",
};

export function MovementsPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"inventory" | "sales" | "all">("inventory");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const params =
      filter === "inventory"
        ? { action: "product.stock_adjust", limit: 200 }
        : filter === "sales"
          ? { entityType: "sale", limit: 200 }
          : { limit: 200 };

    fetchAuditLog(token, params)
      .then(setEntries)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar historial"),
      )
      .finally(() => setLoading(false));
  }, [token, filter]);

  const describePayload = (entry: AuditEntry) => {
    const p = entry.payload as Record<string, unknown> | null;
    if (!p) return "—";
    if (entry.action === "product.stock_adjust") {
      const delta = Number(p.delta);
      return `${p.sku}: ${p.previousStock} → ${p.newStock} (${delta > 0 ? "+" : ""}${delta}) · ${p.reason}`;
    }
    if (entry.action === "sale.cancel") {
      return `Total $${Number(p.total).toFixed(2)}`;
    }
    if (entry.action === "sale.create") {
      return `Pago: ${String(p.paymentMethod ?? "—")}`;
    }
    return JSON.stringify(p).slice(0, 80);
  };

  return (
    <div className="dashboard-page">
      <div className="filter-chips">
        {(
          [
            ["inventory", "Inventario"],
            ["sales", "Ventas"],
            ["all", "Todo"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`chip ${filter === value ? "chip-active" : ""}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
      ) : entries.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay movimientos en esta vista." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Acción</th>
              <th>Usuario</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.createdAt).toLocaleString("es-MX")}</td>
                <td>{ACTION_LABELS[entry.action] ?? entry.action}</td>
                <td>{entry.userName ?? "Sistema"}</td>
                <td>{describePayload(entry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
