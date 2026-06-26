import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  SearchField,
  Table,
  Tabs,
} from "@heroui/react";
import { FileText, Eye } from "lucide-react";
import {
  cancelSale,
  fetchSales,
  type SaleRecord,
} from "../../api/admin-sales.js";
import { AppModal } from "../../components/ui/AppModal.js";
import { EmptyState } from "../../components/EmptyState.js";
import { InteractiveTableRow } from "../../components/ui/InteractiveTableRow.js";
import { ErrorBanner, TableSkeleton } from "../../components/ui/PageFeedback.js";
import { DataPanel } from "../../components/ui/DataPanel.js";
import { PageStatStrip, PageToolbar, PageToolbarGroup } from "../../components/ui/PageToolbar.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { getErrorMessage } from "../../lib/errors.js";

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
  if (filter === "today") return { from: startOfDay(now).toISOString() };
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return { from: startOfDay(weekAgo).toISOString() };
}

const PERIOD_LABELS: Record<DateFilter, string> = {
  today: "Periodo: Hoy",
  week: "Periodo: Últimos 7 días",
  all: "Periodo: Histórico completo",
};

const STATUS_LABELS: Record<"all" | "completed" | "cancelled", string> = {
  all: "Todas",
  completed: "Completadas",
  cancelled: "Canceladas",
};

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
      const list = await fetchSales(token, {
        ...getRange(dateFilter),
        q: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setSales(list);
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar ventas"));
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

  const handleExportPdf = async () => {
    if (sales.length === 0) {
      toastError("No hay ventas para exportar");
      return;
    }
    try {
      const { exportSalesPdf } = await import("../../lib/pdf-reports.js");
      exportSalesPdf(sales, {
        periodLabel: PERIOD_LABELS[dateFilter],
        statusLabel: STATUS_LABELS[statusFilter],
        search: search.trim() || undefined,
      });
      success("PDF descargado");
    } catch (err) {
      toastError(getErrorMessage(err, "Error al generar PDF"));
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
      toastError(getErrorMessage(err, "No se pudo cancelar"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fortino-admin-page">
      <PageToolbar>
        <PageToolbarGroup grow>
          <PageStatStrip
            label="Ventas filtradas"
            value={
              <>
                {stats.count} operación(es) · <span className="price">${stats.total.toFixed(2)} MXN</span>
              </>
            }
          />
        </PageToolbarGroup>
        {canExport && (
          <PageToolbarGroup>
            <Button variant="primary" onPress={handleExportPdf}>
              <FileText size={16} />
              Exportar PDF
            </Button>
          </PageToolbarGroup>
        )}
      </PageToolbar>

      <DataPanel title="Filtros" compact>
        <div className="flex flex-col gap-4 px-4 py-4 md:px-5">
          <Tabs
            selectedKey={dateFilter}
            onSelectionChange={(key) => setDateFilter(key as DateFilter)}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Periodo">
                <Tabs.Tab id="today">Hoy</Tabs.Tab>
                <Tabs.Tab id="week">7 días</Tabs.Tab>
                <Tabs.Tab id="all">Todo</Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          <Tabs
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(key as typeof statusFilter)}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Estado">
                <Tabs.Tab id="all">Todas</Tabs.Tab>
                <Tabs.Tab id="completed">Completadas</Tabs.Tab>
                <Tabs.Tab id="cancelled">Canceladas</Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          <div className="fortino-toolbar !mb-0 !border-0 !p-0">
            <SearchField
              aria-label="Buscar ventas"
              value={search}
              onChange={setSearch}
              className="fortino-toolbar-grow"
            >
              <SearchField.Group>
                <SearchField.Input placeholder="SKU o producto…" onKeyDown={(e) => e.key === "Enter" && load()} />
              </SearchField.Group>
            </SearchField>
            <Button variant="secondary" onPress={() => load()}>
              Buscar
            </Button>
          </div>
        </div>
      </DataPanel>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : sales.length === 0 ? (
        <EmptyState title="Sin ventas" description="No hay operaciones que coincidan con los filtros." />
      ) : (
        <DataPanel title="Historial de ventas" description={`${sales.length} registro(s) en pantalla`} compact>
          <div className="fortino-interactive-table">
          <Table aria-label="Ventas">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>Fecha</Table.Column>
                  <Table.Column>Total</Table.Column>
                  <Table.Column>Pago</Table.Column>
                  <Table.Column>Estado</Table.Column>
                  <Table.Column>Cajero</Table.Column>
                  <Table.Column>Artículos</Table.Column>
                  <Table.Column className="fortino-row-actions-cell" />
                </Table.Header>
                <Table.Body>
                  {sales.map((sale) => (
                    <InteractiveTableRow
                      key={sale.id}
                      id={sale.id}
                      reserveActionsColumn
                      onOpen={() => setSelected(sale)}
                      actions={[
                        {
                          label: "Ver detalle de venta",
                          icon: Eye,
                          onClick: () => setSelected(sale),
                        },
                      ]}
                      ariaLabel={`Venta ${sale.total} MXN`}
                    >
                      <Table.Cell>{new Date(sale.soldAt).toLocaleString("es-MX")}</Table.Cell>
                      <Table.Cell className="mono">${Number(sale.total).toFixed(2)}</Table.Cell>
                      <Table.Cell>{PAYMENT_LABELS[sale.paymentMethod]}</Table.Cell>
                      <Table.Cell>
                        <Chip color={sale.status === "cancelled" ? "danger" : "success"} size="sm">
                          <Chip.Label>
                            {sale.status === "cancelled" ? "Cancelada" : "Completada"}
                          </Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>{sale.cashier?.fullName ?? "—"}</Table.Cell>
                      <Table.Cell>{String(sale.items.length)}</Table.Cell>
                    </InteractiveTableRow>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
        </DataPanel>
      )}

      <AppModal
        open={Boolean(selected)}
        title="Detalle de venta"
        size="lg"
        subtitle={
          selected
            ? `Folio ${selected.id.slice(0, 8)} · ${new Date(selected.soldAt).toLocaleString("es-MX")} · ${PAYMENT_LABELS[selected.paymentMethod]}`
            : undefined
        }
        onClose={() => setSelected(null)}
        onSubmit={canCancel && selected?.status === "completed" ? () => handleCancel(selected!) : undefined}
        submitLabel={cancelling ? "Cancelando…" : "Cancelar venta"}
        danger
        loading={cancelling}
        cancelLabel="Cerrar"
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <Table aria-label="Artículos de la venta">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader>Código SKU</Table.Column>
                    <Table.Column>Nombre del producto</Table.Column>
                    <Table.Column>Cantidad</Table.Column>
                    <Table.Column>Precio unitario</Table.Column>
                    <Table.Column>Importe línea</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {selected.items.map((item, idx) => (
                      <Table.Row key={String(idx)} id={String(idx)}>
                        <Table.Cell className="mono">{item.sku}</Table.Cell>
                        <Table.Cell>{item.productName}</Table.Cell>
                        <Table.Cell>{item.quantity}</Table.Cell>
                        <Table.Cell className="mono">${Number(item.unitPrice).toFixed(2)}</Table.Cell>
                        <Table.Cell className="mono">${Number(item.lineTotal).toFixed(2)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
            <p className="checkout-total price m-0">
              Total: ${Number(selected.total).toFixed(2)} MXN
            </p>
          </div>
        )}
      </AppModal>
    </div>
  );
}
