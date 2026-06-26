import { useEffect, useState } from "react";
import { Chip, Table, Tabs } from "@heroui/react";
import { fetchAuditLog, type AuditEntry } from "../../api/audit.js";
import { EmptyState } from "../../components/EmptyState.js";
import { ErrorBanner, TableSkeleton } from "../../components/ui/PageFeedback.js";
import { DataPanel } from "../../components/ui/DataPanel.js";
import { PageToolbar, PageToolbarGroup } from "../../components/ui/PageToolbar.js";
import { useAuth } from "../../context/AuthContext.js";
import { getErrorMessage } from "../../lib/errors.js";

const ACTION_LABELS: Record<string, string> = {
  "product.stock_adjust": "Ajuste de stock",
  "sale.create": "Venta registrada",
  "sale.cancel": "Venta cancelada",
  "product.create": "Producto creado",
  "product.update": "Producto actualizado",
  "purchase.create": "Compra a proveedor",
};

type FilterValue = "inventory" | "sales" | "all";

const ACTION_CHIP: Record<string, "accent" | "success" | "danger" | "default" | "secondary"> = {
  "product.stock_adjust": "accent",
  "sale.create": "success",
  "sale.cancel": "danger",
  "product.create": "secondary",
  "product.update": "default",
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
  const [filter, setFilter] = useState<FilterValue>("inventory");

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
      <DataPanel title="Historial de movimientos" description="Auditoría de inventario y ventas" compact>
        <div className="px-4 py-4 md:px-5">
          <Tabs
            selectedKey={filter}
            onSelectionChange={(key) => setFilter(key as FilterValue)}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Filtro de movimientos">
                <Tabs.Tab id="inventory">Inventario</Tabs.Tab>
                <Tabs.Tab id="sales">Ventas</Tabs.Tab>
                <Tabs.Tab id="all">Todo</Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      </DataPanel>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay movimientos en esta vista." />
      ) : (
        <DataPanel title="Registros" description={`${entries.length} evento(s)`} compact>
          <div className="fortino-interactive-table">
          <Table aria-label="Historial de movimientos">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>Fecha</Table.Column>
                  <Table.Column>Acción</Table.Column>
                  <Table.Column>Usuario</Table.Column>
                  <Table.Column>Detalle</Table.Column>
                </Table.Header>
                <Table.Body>
                  {entries.map((entry) => (
                    <Table.Row key={entry.id} id={entry.id}>
                      <Table.Cell>
                        {new Date(entry.createdAt).toLocaleString("es-MX")}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip color={ACTION_CHIP[entry.action] ?? "default"} size="sm">
                          <Chip.Label>
                            {ACTION_LABELS[entry.action] ?? entry.action}
                          </Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>{entry.userName ?? "Sistema"}</Table.Cell>
                      <Table.Cell className="text-sm">{describePayload(entry)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
        </DataPanel>
      )}
    </div>
  );
}
