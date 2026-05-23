import { useEffect, useState } from "react";
import { db } from "../db/dexie.js";
import type { Product } from "../types/index.js";

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      const all = await db.products.toArray();
      setProducts(all.sort((a, b) => a.sku.localeCompare(b.sku)));
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = products.filter((p) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  return (
    <div className="panel" style={{ height: "100%" }}>
      <h2 style={{ marginTop: 0 }}>Inventario local</h2>
      <input
        type="search"
        placeholder="Filtrar por SKU o nombre..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ maxWidth: 360, marginBottom: "1rem" }}
      />
      <table className="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Mín.</th>
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
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>
          Sin productos en caché. Conéctate para sincronizar el catálogo.
        </p>
      )}
    </div>
  );
}
