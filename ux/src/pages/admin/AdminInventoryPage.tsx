import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, SearchField, Table, Tabs } from "@heroui/react";
import { FileText, Package } from "lucide-react";
import {
  adjustProductStock,
  fetchAdminProducts,
  type AdminProduct,
} from "../../api/admin-products.js";
import { fetchCategories, type Category } from "../../api/admin-categories.js";
import { ErrorBanner, TableSkeleton } from "../../components/ui/PageFeedback.js";
import { EmptyState } from "../../components/EmptyState.js";
import { InteractiveTableRow } from "../../components/ui/InteractiveTableRow.js";
import { DataPanel } from "../../components/ui/DataPanel.js";
import { PageToolbar, PageToolbarGroup } from "../../components/ui/PageToolbar.js";
import { StockAdjustModal } from "../../components/StockAdjustModal.js";
import { StockBadge } from "../../components/StockBadge.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { getErrorMessage } from "../../lib/errors.js";

type StockFilter = "all" | "low" | "out";

export function AdminInventoryPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
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
      searchParams.delete("bajo");
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get("agotado") === "1") {
      setStockFilter("out");
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
      <PageToolbar>
        <PageToolbarGroup grow>
          <p className="m-0 text-sm text-muted">
            {visible.length} pieza(s) · {stats.low} bajo · {stats.out} agotadas
          </p>
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

      <DataPanel title="Existencias" description="Filtros y búsqueda de inventario" compact>
        <div className="flex flex-col gap-4 px-4 py-4 md:px-5">
          <Tabs
            selectedKey={stockFilter}
            onSelectionChange={(key) => setStockFilter(key as StockFilter)}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Filtro de stock">
                <Tabs.Tab id="all">Todos ({stats.total})</Tabs.Tab>
                <Tabs.Tab id="low">Stock bajo ({stats.low})</Tabs.Tab>
                <Tabs.Tab id="out">Sin stock ({stats.out})</Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          <div className="fortino-toolbar !mb-0 !border-0 !p-0">
            <SearchField
              aria-label="Buscar en inventario"
              value={filter}
              onChange={setFilter}
              className="fortino-toolbar-grow"
            >
              <SearchField.Group>
                <SearchField.Input
                  id="admin-inventory-search"
                  placeholder="SKU o nombre…"
                  onKeyDown={(e) => e.key === "Enter" && load()}
                />
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
        <DataPanel title="Listado de inventario" description={`${visible.length} producto(s)`} compact>
          <div className="fortino-interactive-table">
          <Table aria-label="Inventario">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>SKU</Table.Column>
                  <Table.Column>Producto</Table.Column>
                  <Table.Column>Categoría</Table.Column>
                  <Table.Column>Stock</Table.Column>
                  <Table.Column>Mínimo</Table.Column>
                  <Table.Column>Estado</Table.Column>
                  {canEdit && <Table.Column className="fortino-row-actions-cell" />}
                </Table.Header>
                <Table.Body>
                  {visible.map((p) => (
                    <InteractiveTableRow
                      key={p.id}
                      id={p.id}
                      reserveActionsColumn={canEdit}
                      onOpen={canEdit ? () => setAdjustProduct(p) : undefined}
                      actions={
                        canEdit
                          ? [
                              {
                                label: "Ajustar inventario",
                                icon: Package,
                                onClick: () => setAdjustProduct(p),
                              },
                            ]
                          : []
                      }
                      ariaLabel={`Inventario ${p.name}`}
                    >
                      <Table.Cell className="mono">{p.sku}</Table.Cell>
                      <Table.Cell>{p.name}</Table.Cell>
                      <Table.Cell>
                        {p.categoryId ? categoryMap.get(p.categoryId) ?? "—" : "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <span
                          className={
                            p.stock <= 0
                              ? "fortino-text-error"
                              : p.stock <= p.minStock
                                ? "fortino-text-warning"
                                : undefined
                          }
                        >
                          {p.stock}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{p.minStock}</Table.Cell>
                      <Table.Cell>
                        <StockBadge stock={p.stock} minStock={p.minStock} />
                      </Table.Cell>
                    </InteractiveTableRow>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
        </DataPanel>
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
