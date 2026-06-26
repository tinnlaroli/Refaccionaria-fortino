import { useEffect, useMemo, useState } from "react";
import { Button, SearchField, Table, Tabs } from "@heroui/react";
import { FileText } from "lucide-react";
import { db } from "../db/dexie.js";
import { EmptyState } from "../components/EmptyState.js";
import { DataPanel } from "../components/ui/DataPanel.js";
import { PageToolbar, PageToolbarGroup } from "../components/ui/PageToolbar.js";
import { StockBadge } from "../components/StockBadge.js";
import { useToast } from "../context/ToastContext.js";
import { getErrorMessage } from "../lib/errors.js";
import type { Product } from "../types/index.js";

type StockFilter = "all" | "low" | "out";

export function InventoryPage() {
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  useEffect(() => {
    const load = async () => {
      const all = await db.products.toArray();
      setProducts(all.sort((a, b) => a.sku.localeCompare(b.sku)));
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive);
    return {
      total: active.length,
      low: active.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
      out: active.filter((p) => p.stock <= 0).length,
    };
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.isActive);
    if (stockFilter === "low") {
      list = list.filter((p) => p.stock > 0 && p.stock <= p.minStock);
    } else if (stockFilter === "out") {
      list = list.filter((p) => p.stock <= 0);
    }
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(
        (p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, filter, stockFilter]);

  const handleExportPdf = async () => {
    if (filtered.length === 0) {
      toastError("No hay productos para exportar");
      return;
    }
    try {
      const { exportInventoryPdf } = await import("../lib/pdf-reports.js");
      exportInventoryPdf(
        filtered.map((p) => ({
          sku: p.sku,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          salePrice: p.salePrice,
        })),
        {
          filterLabel:
            stockFilter === "low"
              ? "Filtro: Stock bajo · Inventario local"
              : stockFilter === "out"
                ? "Filtro: Sin stock · Inventario local"
                : "Inventario local sincronizado",
          search: filter.trim() || undefined,
        },
      );
      success("PDF descargado");
    } catch (err) {
      toastError(getErrorMessage(err, "Error al generar PDF"));
    }
  };

  return (
    <div className="fortino-pos-main fortino-pos-inventory">
      <div className="flex flex-col gap-5">
        <header className="fortino-page-header !mb-4 !pb-3">
          <h2 className="fortino-heading-section">Inventario local</h2>
          <p className="fortino-lead">Existencias sincronizadas en este dispositivo.</p>
        </header>

        <PageToolbar>
          <PageToolbarGroup grow>
            <p className="m-0 text-sm text-muted">
              {filtered.length} pieza(s) · {stats.low} bajo · {stats.out} agotadas
            </p>
          </PageToolbarGroup>
          <PageToolbarGroup>
            <Button variant="primary" onPress={handleExportPdf}>
              <FileText size={16} />
              Exportar PDF
            </Button>
          </PageToolbarGroup>
        </PageToolbar>

        <DataPanel title="Catálogo local" compact>
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

            <SearchField
              aria-label="Filtrar inventario"
              value={filter}
              onChange={setFilter}
              className="w-full"
            >
              <SearchField.Group>
                <SearchField.Input id="local-inventory-search" placeholder="SKU o nombre…" />
              </SearchField.Group>
            </SearchField>
          </div>
        </DataPanel>

        {filtered.length === 0 ? (
          <EmptyState
            title="Sin piezas en esta vista"
            description={
              products.length === 0
                ? "Conéctate para sincronizar el catálogo desde el servidor."
                : "Prueba otro filtro o término de búsqueda."
            }
          />
        ) : (
          <DataPanel title="Listado" description={`${filtered.length} producto(s)`} compact>
            <div className="fortino-interactive-table">
          <Table aria-label="Inventario local">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>SKU</Table.Column>
                  <Table.Column>Nombre</Table.Column>
                  <Table.Column>Precio</Table.Column>
                  <Table.Column>Stock</Table.Column>
                  <Table.Column>Mínimo</Table.Column>
                  <Table.Column>Estado</Table.Column>
                </Table.Header>
                <Table.Body>
                  {filtered.map((p) => {
                    const out = p.stock <= 0;
                    const low = p.stock <= p.minStock;
                    return (
                      <Table.Row key={p.id} id={p.id}>
                        <Table.Cell className="mono">{p.sku}</Table.Cell>
                        <Table.Cell>{p.name}</Table.Cell>
                        <Table.Cell className="mono">
                          ${Number(p.salePrice).toFixed(2)}
                        </Table.Cell>
                        <Table.Cell>
                          <span className={out ? "fortino-text-error" : low ? "fortino-text-warning" : undefined}>
                            {p.stock}
                          </span>
                        </Table.Cell>
                        <Table.Cell>{p.minStock}</Table.Cell>
                        <Table.Cell>
                          <StockBadge stock={p.stock} minStock={p.minStock} />
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
            </div>
          </DataPanel>
        )}
      </div>
    </div>
  );
}
