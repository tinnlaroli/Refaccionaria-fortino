import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
} from "@carbon/react";
import { InventoryManagement, DocumentPdf } from "@carbon/icons-react";
import {
  adjustProductStock,
  fetchAdminProducts,
  type AdminProduct,
} from "../../api/admin-products.js";
import { fetchCategories, type Category } from "../../api/admin-categories.js";
import { ErrorBanner, TableSkeleton } from "../../components/carbon/PageFeedback.js";
import {
  InteractiveTableRow,
  TABLE_ACTIONS_RAIL,
} from "../../components/carbon/InteractiveTableRow.js";
import { EmptyState } from "../../components/EmptyState.js";
import { StockAdjustModal } from "../../components/StockAdjustModal.js";
import { StockBadge } from "../../components/StockBadge.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { getErrorMessage } from "../../lib/errors.js";

type StockFilter = "all" | "low" | "out";

const FILTER_OPTIONS = [
  { i: 0, v: "all" as const, label: (s: { total: number }) => `Todos (${s.total})` },
  { i: 1, v: "low" as const, label: (s: { low: number }) => `Stock bajo (${s.low})` },
  { i: 2, v: "out" as const, label: (s: { out: number }) => `Sin stock (${s.out})` },
];

export function AdminInventoryPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [filterIndex, setFilterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<AdminProduct | null>(null);

  const canEdit = hasPermission("products.edit");
  const canExport = hasPermission("reports.export");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [list, cats] = await Promise.all([
        fetchAdminProducts(token, {
          q: filter || undefined,
          lowStock: stockFilter === "low",
        }),
        fetchCategories(token),
      ]);
      setProducts(list);
      setCategories(cats);
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar inventario"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, stockFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("bajo") === "1") {
      setStockFilter("low");
      setFilterIndex(1);
      searchParams.delete("bajo");
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get("agotado") === "1") {
      setStockFilter("out");
      setFilterIndex(2);
      searchParams.delete("agotado");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const visible = useMemo(() => {
    if (stockFilter === "out") {
      return products.filter((p) => p.isActive && p.stock <= 0);
    }
    return products.filter((p) => p.isActive);
  }, [products, stockFilter]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive);
    return {
      total: active.length,
      low: active.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
      out: active.filter((p) => p.stock <= 0).length,
    };
  }, [products]);

  const handleAdjust = async (payload: Parameters<typeof adjustProductStock>[2]) => {
    if (!token || !adjustProduct) return;
    await adjustProductStock(token, adjustProduct.id, payload);
    success(`Stock actualizado: ${adjustProduct.sku}`);
    setAdjustProduct(null);
    await load();
  };

  const handleExportPdf = async () => {
    if (visible.length === 0) {
      toastError("No hay productos para exportar");
      return;
    }
    try {
      const { exportInventoryPdf } = await import("../../lib/pdf-reports.js");
      exportInventoryPdf(
        visible.map((p) => ({
          sku: p.sku,
          name: p.name,
          category: p.categoryId ? categoryMap.get(p.categoryId) : undefined,
          stock: p.stock,
          minStock: p.minStock,
          salePrice: p.salePrice,
        })),
        {
          filterLabel:
            stockFilter === "low"
              ? "Filtro: Stock bajo"
              : stockFilter === "out"
                ? "Filtro: Sin stock"
                : "Filtro: Todos los productos activos",
          search: filter.trim() || undefined,
        },
      );
      success("PDF descargado");
    } catch (err) {
      toastError(getErrorMessage(err, "Error al generar PDF"));
    }
  };

  return (
    <div className="fortino-admin-page">
      {canExport && (
        <div className="fortino-page-actions" style={{ justifyContent: "flex-end", width: "100%" }}>
          <Button kind="primary" renderIcon={DocumentPdf} onClick={handleExportPdf}>
            Exportar PDF
          </Button>
        </div>
      )}

      <ContentSwitcher
        selectedIndex={filterIndex}
        onChange={({ index }) => {
          const idx = Number(index ?? 0);
          setFilterIndex(idx);
          setStockFilter(FILTER_OPTIONS[idx]?.v ?? "all");
        }}
      >
        {FILTER_OPTIONS.map((o) => (
          <Switch key={o.v} name={o.v} text={o.label(stats)} />
        ))}
      </ContentSwitcher>

      <div className="fortino-toolbar" style={{ marginTop: "1rem" }}>
        <div className="fortino-toolbar-grow">
          <Search
            id="admin-inventory-search"
            labelText="Buscar en inventario"
            placeholder="SKU o nombre…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
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
      ) : visible.length === 0 ? (
        <EmptyState
          title="Sin piezas en esta vista"
          description={
            stockFilter === "out"
              ? "No hay productos agotados. Buen trabajo."
              : "Prueba otro filtro o agrega productos al catálogo."
          }
        />
      ) : (
        <div className="fortino-interactive-table">
        <DataTable
          rows={visible.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.categoryId ? categoryMap.get(p.categoryId) ?? "—" : "—",
            stock: String(p.stock),
            min: String(p.minStock),
            status: p.id,
          }))}
          headers={[
            { key: "sku", header: "SKU" },
            { key: "name", header: "Producto" },
            { key: "category", header: "Categoría" },
            { key: "stock", header: "Stock" },
            { key: "min", header: "Mínimo" },
            { key: "status", header: "Estado" },
            ...(canEdit ? [TABLE_ACTIONS_RAIL] : []),
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
                  const p = visible.find((x) => x.id === row.id)!;
                  return (
                    <InteractiveTableRow
                      key={row.id}
                      rowProps={getRowProps({ row })}
                      onOpen={canEdit ? () => setAdjustProduct(p) : undefined}
                      actions={
                        canEdit
                          ? [
                              {
                                label: "Ajustar inventario",
                                icon: InventoryManagement,
                                onClick: () => setAdjustProduct(p),
                              },
                            ]
                          : []
                      }
                      ariaLabel={`Inventario ${p.name}`}
                    >
                      {row.cells.map((cell) => {
                        if (cell.info.header === "status") {
                          return (
                            <TableCell key={cell.id}>
                              <StockBadge stock={p.stock} minStock={p.minStock} />
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "sku") {
                          return (
                            <TableCell key={cell.id} className="mono">
                              {cell.value}
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "stock") {
                          return (
                            <TableCell key={cell.id}>
                              <span
                                className={
                                  p.stock <= 0
                                    ? "fortino-text-error"
                                    : p.stock <= p.minStock
                                      ? "fortino-text-warning"
                                      : undefined
                                }
                              >
                                {cell.value}
                              </span>
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

      {adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSubmit={async (payload) => {
            try {
              await handleAdjust(payload);
            } catch (err) {
              toastError(getErrorMessage(err));
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
