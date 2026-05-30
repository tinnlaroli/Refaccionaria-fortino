import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ContentSwitcher,
  DataTable,
  Search,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@carbon/react";
import { Download, DocumentPdf } from "@carbon/icons-react";
import {
  cancelSale,
  exportSalesCsv,
  fetchSales,
  type SaleRecord,
} from "../../api/admin-sales.js";
import { AppModal } from "../../components/carbon/AppModal.js";
import {
  InteractiveTableRow,
  TABLE_ACTIONS_RAIL,
} from "../../components/carbon/InteractiveTableRow.js";
import { ErrorBanner, TableSkeleton } from "../../components/carbon/PageFeedback.js";
import { EmptyState } from "../../components/EmptyState.js";
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

const DATE_OPTIONS = [
  { i: 0, v: "today" as const, t: "Hoy" },
  { i: 1, v: "week" as const, t: "7 días" },
  { i: 2, v: "all" as const, t: "Todo" },
];

const PERIOD_LABELS: Record<DateFilter, string> = {
  today: "Periodo: Hoy",
  week: "Periodo: Últimos 7 días",
  all: "Periodo: Histórico completo",
};

const STATUS_OPTIONS = [
  { i: 0, v: "all" as const, t: "Todas" },
  { i: 1, v: "completed" as const, t: "Completadas" },
  { i: 2, v: "cancelled" as const, t: "Canceladas" },
];

const STATUS_LABELS: Record<(typeof STATUS_OPTIONS)[number]["v"], string> = {
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
  const [dateIndex, setDateIndex] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [statusIndex, setStatusIndex] = useState(0);
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

  const handleExportCsv = async () => {
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
      toastError(getErrorMessage(err, "Error al exportar"));
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
      <div className="fortino-page-actions" style={{ justifyContent: "space-between", width: "100%" }}>
        <p className="cds--body-compact-01" style={{ margin: 0 }}>
          {stats.count} venta(s) · <strong className="price">${stats.total.toFixed(2)} MXN</strong>
        </p>
        {canExport && (
          <>
            <Button kind="primary" renderIcon={DocumentPdf} onClick={handleExportPdf}>
              Exportar PDF
            </Button>
            <Button kind="tertiary" renderIcon={Download} onClick={handleExportCsv}>
              CSV
            </Button>
          </>
        )}
      </div>

      <Stack gap={4}>
        <ContentSwitcher
          selectedIndex={dateIndex}
          onChange={({ index }) => {
            const idx = Number(index ?? 0);
            setDateIndex(idx);
            setDateFilter(DATE_OPTIONS[idx]?.v ?? "week");
          }}
        >
          {DATE_OPTIONS.map((o) => (
            <Switch key={o.v} name={o.v} text={o.t} />
          ))}
        </ContentSwitcher>

        <ContentSwitcher
          selectedIndex={statusIndex}
          onChange={({ index }) => {
            const idx = Number(index ?? 0);
            setStatusIndex(idx);
            setStatusFilter(STATUS_OPTIONS[idx]?.v ?? "all");
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <Switch key={o.v} name={o.v} text={o.t} />
          ))}
        </ContentSwitcher>
      </Stack>

      <div className="fortino-toolbar" style={{ marginTop: "1rem" }}>
        <div className="fortino-toolbar-grow">
          <Search
            id="sales-search"
            labelText="Buscar ventas"
            placeholder="SKU o producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <Button kind="secondary" onClick={() => load()}>
          Buscar
        </Button>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : sales.length === 0 ? (
        <EmptyState title="Sin ventas" description="No hay operaciones que coincidan con los filtros." />
      ) : (
        <div className="fortino-interactive-table">
        <DataTable
          rows={sales.map((s) => ({
            id: s.id,
            date: new Date(s.soldAt).toLocaleString("es-MX"),
            total: `$${Number(s.total).toFixed(2)}`,
            payment: PAYMENT_LABELS[s.paymentMethod],
            status: s.status,
            cashier: s.cashier?.fullName ?? "—",
            items: String(s.items.length),
          }))}
          headers={[
            { key: "date", header: "Fecha" },
            { key: "total", header: "Total" },
            { key: "payment", header: "Pago" },
            { key: "status", header: "Estado" },
            { key: "cashier", header: "Cajero" },
            { key: "items", header: "Artículos" },
            TABLE_ACTIONS_RAIL,
          ]}
        >
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableHeader
                      {...getHeaderProps({ header: h })}
                      key={h.key}
                      className={h.key === "_rail" ? "fortino-row-actions-cell" : undefined}
                    >
                      {h.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const sale = sales.find((s) => s.id === row.id)!;
                  return (
                    <InteractiveTableRow
                      key={row.id}
                      rowProps={getRowProps({ row })}
                      onOpen={() => setSelected(sale)}
                      actions={[
                        {
                          label: "Ver detalle de venta",
                          icon: View,
                          onClick: () => setSelected(sale),
                        },
                      ]}
                      ariaLabel={`Venta ${sale.total} MXN`}
                    >
                      {row.cells.map((cell) => {
                        if (cell.info.header === "status") {
                          return (
                            <TableCell key={cell.id}>
                              <Tag type={sale.status === "cancelled" ? "red" : "green"} size="sm">
                                {sale.status === "cancelled" ? "Cancelada" : "Completada"}
                              </Tag>
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "total") {
                          return (
                            <TableCell key={cell.id} className="mono">
                              {cell.value}
                            </TableCell>
                          );
                        }
                        return <TableCell key={cell.id}>{cell.value}</TableCell>;
                      })}
                    </InteractiveTableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DataTable>
        </div>
      )}

      <AppModal
        open={Boolean(selected)}
        title="Detalle de venta"
        subtitle={
          selected
            ? `${new Date(selected.soldAt).toLocaleString("es-MX")} · ${PAYMENT_LABELS[selected.paymentMethod]} · ${selected.cashier?.fullName ?? "Cajero"}`
            : undefined
        }
        size="lg"
        onClose={() => setSelected(null)}
        onSubmit={canCancel && selected?.status === "completed" ? () => handleCancel(selected!) : undefined}
        submitLabel={cancelling ? "Cancelando…" : "Cancelar venta"}
        danger
        loading={cancelling}
        cancelLabel="Cerrar"
      >
        {selected && (
          <Stack gap={4}>
            <DataTable
              rows={selected.items.map((item, idx) => ({
                id: String(idx),
                sku: item.sku,
                name: item.productName,
                qty: String(item.quantity),
                price: `$${Number(item.unitPrice).toFixed(2)}`,
                total: `$${Number(item.lineTotal).toFixed(2)}`,
              }))}
              headers={[
                { key: "sku", header: "SKU" },
                { key: "name", header: "Producto" },
                { key: "qty", header: "Cant." },
                { key: "price", header: "Precio" },
                { key: "total", header: "Importe" },
              ]}
              size="sm"
            >
              {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                <Table {...getTableProps()} size="sm">
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
                    {rows.map((row) => (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id} className={cell.info.header === "sku" || cell.info.header === "total" ? "mono" : undefined}>
                            {cell.value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
            <p className="checkout-total price" style={{ margin: 0 }}>
              Total: ${Number(selected.total).toFixed(2)} MXN
            </p>
          </Stack>
        )}
      </AppModal>
    </div>
  );
}
