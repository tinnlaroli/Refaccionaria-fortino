import { useEffect, useState } from "react";
import {
  ContentSwitcher,
  DataTable,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@carbon/react";
import { fetchAuditLog, type AuditEntry } from "../../api/audit.js";
import { ErrorBanner, TableSkeleton } from "../../components/carbon/PageFeedback.js";
import { EmptyState } from "../../components/EmptyState.js";
import { useAuth } from "../../context/AuthContext.js";
import { getErrorMessage } from "../../lib/errors.js";

const ACTION_LABELS: Record<string, string> = {
  "product.stock_adjust": "Ajuste de stock",
  "sale.create": "Venta registrada",
  "sale.cancel": "Venta cancelada",
  "product.create": "Producto creado",
  "product.update": "Producto actualizado",
};

const FILTER_OPTIONS = [
  { i: 0, v: "inventory" as const, t: "Inventario" },
  { i: 1, v: "sales" as const, t: "Ventas" },
  { i: 2, v: "all" as const, t: "Todo" },
];

const ACTION_TAG: Record<string, "blue" | "green" | "red" | "gray" | "purple"> = {
  "product.stock_adjust": "blue",
  "sale.create": "green",
  "sale.cancel": "red",
  "product.create": "purple",
  "product.update": "gray",
};

const PAYMENT_LABELS_ES: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export function MovementsPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"inventory" | "sales" | "all">("inventory");
  const [filterIndex, setFilterIndex] = useState(0);

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
      .catch((err) => setError(getErrorMessage(err, "Error al cargar historial")))
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
      const method = String(p.paymentMethod ?? "");
      return `Pago: ${(PAYMENT_LABELS_ES[method] ?? method) || "—"}`;
    }
    return JSON.stringify(p).slice(0, 120);
  };

  return (
    <div className="fortino-admin-page">
      <ContentSwitcher
        selectedIndex={filterIndex}
        onChange={({ index }) => {
          const idx = Number(index ?? 0);
          setFilterIndex(idx);
          setFilter(FILTER_OPTIONS[idx]?.v ?? "inventory");
        }}
      >
        {FILTER_OPTIONS.map((o) => (
          <Switch key={o.v} name={o.v} text={o.t} />
        ))}
      </ContentSwitcher>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay movimientos en esta vista." />
      ) : (
        <DataTable
          rows={entries.map((e) => ({
            id: e.id,
            date: new Date(e.createdAt).toLocaleString("es-MX"),
            action: e.action,
            user: e.userName ?? "Sistema",
            detail: describePayload(e),
          }))}
          headers={[
            { key: "date", header: "Fecha" },
            { key: "action", header: "Acción" },
            { key: "user", header: "Usuario" },
            { key: "detail", header: "Detalle" },
          ]}
        >
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableHeader {...getHeaderProps({ header: h })} key={h.key}>
                      {h.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const entry = entries.find((e) => e.id === row.id)!;
                  return (
                    <TableRow {...getRowProps({ row })} key={row.id}>
                      {row.cells.map((cell) => {
                        if (cell.info.header === "action") {
                          return (
                            <TableCell key={cell.id}>
                              <Tag type={ACTION_TAG[entry.action] ?? "gray"} size="sm">
                                {ACTION_LABELS[entry.action] ?? entry.action}
                              </Tag>
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "detail") {
                          return (
                            <TableCell key={cell.id} className="cds--body-compact-01">
                              {cell.value}
                            </TableCell>
                          );
                        }
                        return <TableCell key={cell.id}>{cell.value}</TableCell>;
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DataTable>
      )}
    </div>
  );
}
