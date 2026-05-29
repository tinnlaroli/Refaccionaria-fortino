import { useEffect, useMemo, useState } from "react";
import {
  cancelSale,
  exportSalesCsv,
  fetchSales,
  type SaleRecord,
} from "../../api/admin-sales.js";
import { EmptyState } from "../../components/EmptyState.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";

type DateFilter = "today" | "week" | "all";

const PAYMENT_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
} as const;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getRange(filter: DateFilter): { from?: string; to?: string } {
  if (filter === "all") return {};
  const now = new Date();
  if (filter === "today") {
    return { from: startOfDay(now).toISOString() };
  }
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return { from: startOfDay(weekAgo).toISOString() };
}

export function SalesPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success, error: toastError } = useToast();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("week");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [selected, setSelected] = useState<SaleRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const canCancel = hasPermission("sales.cancel");
  const canExport = hasPermission("reports.export");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const range = getRange(dateFilter);
      const list = await fetchSales(token, {
        ...range,
        q: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setSales(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, dateFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const completed = sales.filter((s) => s.status === "completed");
    return {
      count: completed.length,
      total: completed.reduce((sum, s) => sum + Number(s.total), 0),
    };
  }, [sales]);

  const handleExport = async () => {
    if (!token) return;
    try {
      const blob = await exportSalesCsv(token, getRange(dateFilter));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ventas-fortino.csv";
      a.click();
      URL.revokeObjectURL(url);
      success("Exportación descargada");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error al exportar");
    }
  };

  const handleCancel = async (sale: SaleRecord) => {
    if (!token || !canCancel) return;
    if (!window.confirm(`¿Cancelar venta por $${Number(sale.total).toFixed(2)}? Se restaurará el stock.`)) {
      return;
    }
    setCancelling(true);
    try {
      await cancelSale(token, sale.id);
      success("Venta cancelada");
      setSelected(null);
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "No se pudo cancelar");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-actions-bar page-actions-bar-split">
        <p className="page-inline-stat">
          {stats.count} venta(s) · <strong>${stats.total.toFixed(2)} MXN</strong> en este periodo
        </p>
        {canExport && (
          <button type="button" className="btn-ghost" onClick={handleExport}>
            Exportar CSV
          </button>
        )}
      </div>

      <div className="filter-chips">
        {(
          [
            ["today", "Hoy"],
            ["week", "7 días"],
            ["all", "Todo"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`chip ${dateFilter === value ? "chip-active" : ""}`}
            onClick={() => setDateFilter(value)}
          >
            {label}
          </button>
        ))}
        {(
          [
            ["all", "Todas"],
            ["completed", "Completadas"],
            ["cancelled", "Canceladas"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`chip ${statusFilter === value ? "chip-active" : ""}`}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          type="search"
          placeholder="Buscar por SKU o producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-ghost">
          Buscar
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
      ) : sales.length === 0 ? (
        <EmptyState
          title="Sin ventas"
          description="No hay operaciones que coincidan con los filtros."
        />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Estado</th>
              <th>Cajero</th>
              <th>Artículos</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{new Date(sale.soldAt).toLocaleString("es-MX")}</td>
                <td className="price">${Number(sale.total).toFixed(2)}</td>
                <td>{PAYMENT_LABELS[sale.paymentMethod]}</td>
                <td>
                  {sale.status === "cancelled" ? (
                    <span className="badge badge-danger">Cancelada</span>
                  ) : (
                    <span className="badge badge-ok">Completada</span>
                  )}
                </td>
                <td>{sale.cashier?.fullName ?? "—"}</td>
                <td>{sale.items.length}</td>
                <td>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setSelected(sale)}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-glass modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>Detalle de venta</h3>
            <p className="modal-subtitle">
              {new Date(selected.soldAt).toLocaleString("es-MX")} ·{" "}
              {PAYMENT_LABELS[selected.paymentMethod]} ·{" "}
              {selected.cashier?.fullName ?? "Cajero"}
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((item) => (
                  <tr key={`${item.sku}-${item.quantity}`}>
                    <td className="sku">{item.sku}</td>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="price">${Number(item.lineTotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="checkout-total price" style={{ marginTop: "1rem" }}>
              Total: ${Number(selected.total).toFixed(2)} MXN
            </p>
            <div className="form-actions">
              {canCancel && selected.status === "completed" && (
                <button
                  type="button"
                  className="btn-danger"
                  disabled={cancelling}
                  onClick={() => handleCancel(selected)}
                >
                  {cancelling ? "Cancelando..." : "Cancelar venta"}
                </button>
              )}
              <button type="button" className="btn-ghost" onClick={() => setSelected(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
