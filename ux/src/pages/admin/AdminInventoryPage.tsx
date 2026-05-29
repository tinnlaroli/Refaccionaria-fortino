import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  adjustProductStock,
  fetchAdminProducts,
  type AdminProduct,
} from "../../api/admin-products.js";
import { fetchCategories, type Category } from "../../api/admin-categories.js";
import { EmptyState } from "../../components/EmptyState.js";
import { StockAdjustModal } from "../../components/StockAdjustModal.js";
import { StockBadge } from "../../components/StockBadge.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";

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
      setError(err instanceof Error ? err.message : "Error al cargar inventario");
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

  return (
    <div className="dashboard-page">
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

      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <input
          type="search"
          placeholder="Buscar por SKU o nombre..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button type="submit" className="btn-ghost">
          Buscar
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Cargando inventario...</p>
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
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Mín.</th>
              <th>Estado</th>
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td className="sku">{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.categoryId ? categoryMap.get(p.categoryId) ?? "—" : "—"}</td>
                <td
                  className={
                    p.stock <= 0 ? "stock-out" : p.stock <= p.minStock ? "stock-low" : ""
                  }
                >
                  {p.stock}
                </td>
                <td>{p.minStock}</td>
                <td>
                  <StockBadge stock={p.stock} minStock={p.minStock} />
                </td>
                {canEdit && (
                  <td>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setAdjustProduct(p)}
                    >
                      Ajustar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSubmit={async (payload) => {
            try {
              await handleAdjust(payload);
            } catch (err) {
              toastError(err instanceof Error ? err.message : "Error al ajustar");
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}
