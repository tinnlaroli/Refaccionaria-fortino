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
} from "@carbon/react";
import { DocumentPdf } from "@carbon/icons-react";
import { db } from "../db/dexie.js";
import { EmptyState } from "../components/EmptyState.js";
import { StockBadge } from "../components/StockBadge.js";
import { useToast } from "../context/ToastContext.js";
import { getErrorMessage } from "../lib/errors.js";
import type { Product } from "../types/index.js";

type StockFilter = "all" | "low" | "out";

const FILTER_OPTIONS = [
  { i: 0, v: "all" as const, label: (s: { total: number }) => `Todos (${s.total})` },
  { i: 1, v: "low" as const, label: (s: { low: number }) => `Stock bajo (${s.low})` },
  { i: 2, v: "out" as const, label: (s: { out: number }) => `Sin stock (${s.out})` },
];

export function InventoryPage() {
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [filterIndex, setFilterIndex] = useState(0);

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
      <Stack gap={5}>
        <div>
          <h2 className="fortino-heading-section">Inventario local</h2>
          <p className="fortino-lead">
            Existencias sincronizadas en este dispositivo.
          </p>
        </div>

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

        <div className="fortino-toolbar">
          <div className="fortino-toolbar-grow">
            <Search
              id="local-inventory-search"
              labelText="Filtrar inventario"
              placeholder="SKU o nombre…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button kind="primary" renderIcon={DocumentPdf} onClick={handleExportPdf}>
            Exportar PDF
          </Button>
        </div>

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
          <DataTable
            rows={filtered.map((p) => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              price: `$${Number(p.salePrice).toFixed(2)}`,
              stock: String(p.stock),
              min: String(p.minStock),
              status: p.id,
            }))}
            headers={[
              { key: "sku", header: "SKU" },
              { key: "name", header: "Nombre" },
              { key: "price", header: "Precio" },
              { key: "stock", header: "Stock" },
              { key: "min", header: "Mínimo" },
              { key: "status", header: "Estado" },
            ]}
            size="md"
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
                    const p = filtered.find((x) => x.id === row.id)!;
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => {
                          if (cell.info.header === "status") {
                            return (
                              <TableCell key={cell.id}>
                                <StockBadge stock={p.stock} minStock={p.minStock} />
                              </TableCell>
                            );
                          }
                          if (cell.info.header === "stock") {
                            const out = p.stock <= 0;
                            const low = p.stock <= p.minStock;
                            return (
                              <TableCell key={cell.id}>
                                <span style={{ color: out ? "var(--cds-support-error)" : low ? "var(--cds-support-warning)" : undefined }}>
                                  {cell.value}
                                </span>
                              </TableCell>
                            );
                          }
                          if (cell.info.header === "sku" || cell.info.header === "price") {
                            return (
                              <TableCell key={cell.id} className="mono">
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
      </Stack>
    </div>
  );
}
