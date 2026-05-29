import { useEffect, useMemo, useState } from "react";
import { db } from "../db/dexie.js";
import { EmptyState } from "../components/EmptyState.js";
import { StockBadge } from "../components/StockBadge.js";
import type { Product } from "../types/index.js";

type StockFilter = "all" | "low" | "out";

export function InventoryPage() {
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

  return (
    <div className="panel" style={{ height: "100%" }}>
      <h2 style={{ marginTop: 0 }}>Inventario local</h2>
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Vista de existencias sincronizadas en este dispositivo.
      </p>

      <div className="filter-chips">
        <button
          type="button"
          className={`chip ${stockFilter === "all" ? "chip-active" : ""}`}
          onClick={() => setStockFilter("all")}
        >
          Todos ({stats.total})
        </button>
        <button
          type="button"
          className={`chip ${stockFilter === "low" ? "chip-active" : ""}`}
          onClick={() => setStockFilter("low")}
        >
          Stock bajo ({stats.low})
        </button>
        <button
          type="button"
          className={`chip ${stockFilter === "out" ? "chip-active" : ""}`}
          onClick={() => setStockFilter("out")}
        >
          Sin stock ({stats.out})
        </button>
      </div>

      <input
        type="search"
        placeholder="Filtrar por SKU o nombre..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ maxWidth: 360, marginBottom: "1rem" }}
      />

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
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Mín.</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const stockClass =
                p.stock <= 0
                  ? "stock-out"
                  : p.stock <= p.minStock
                    ? "stock-low"
                    : "";
              return (
                <tr key={p.id}>
                  <td className="sku">{p.sku}</td>
                  <td>{p.name}</td>
                  <td className="price">${Number(p.salePrice).toFixed(2)}</td>
                  <td className={stockClass}>{p.stock}</td>
                  <td>{p.minStock}</td>
                  <td>
                    <StockBadge stock={p.stock} minStock={p.minStock} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
