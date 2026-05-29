import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createProduct,
  fetchAdminProducts,
  updateProduct,
  adjustProductStock,
  type AdminProduct,
  type ProductInput,
} from "../../api/admin-products.js";
import { fetchCategories, type Category } from "../../api/admin-categories.js";
import { EmptyState } from "../../components/EmptyState.js";
import { StockAdjustModal } from "../../components/StockAdjustModal.js";
import { StockBadge } from "../../components/StockBadge.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";

const emptyForm: ProductInput = {
  sku: "",
  name: "",
  description: "",
  categoryId: null,
  purchasePrice: "",
  salePrice: "",
  stock: 0,
  minStock: 0,
  isActive: true,
};

export function ProductsPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<AdminProduct | null>(null);

  const canCreate = hasPermission("products.create");
  const canEdit = hasPermission("products.edit");
  const canViewCosts = hasPermission("products.view_costs");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [list, cats] = await Promise.all([
        fetchAdminProducts(token, {
          q: filter || undefined,
          lowStock: lowStockOnly,
        }),
        fetchCategories(token),
      ]);
      setProducts(list);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("nuevo") === "1" && canCreate) {
      openCreate();
      searchParams.delete("nuevo");
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get("bajo") === "1") {
      setLowStockOnly(true);
      searchParams.delete("bajo");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, canCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId ?? null,
      purchasePrice: product.purchasePrice ?? "",
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      isActive: product.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        purchasePrice: canViewCosts
          ? form.purchasePrice
          : form.purchasePrice || form.salePrice,
      };
      if (editing) {
        await updateProduct(token, editing.id, payload);
        success("Producto actualizado");
      } else {
        await createProduct(token, payload);
        success("Producto creado");
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await load();
  };

  return (
    <div className="dashboard-page">
      <div className="page-actions-bar">
        {canCreate && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            + Agregar producto
          </button>
        )}
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Buscar por SKU o nombre..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <label className="form-check" style={{ margin: 0 }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Solo stock bajo
        </label>
        <button type="submit" className="btn-ghost">
          Buscar
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
      ) : products.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description={
            lowStockOnly
              ? "No hay piezas con stock bajo en este momento."
              : "Agrega la primera refacción al catálogo."
          }
          action={
            canCreate ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                + Agregar producto
              </button>
            ) : undefined
          }
        />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              {canViewCosts && <th>Costo</th>}
              <th>Venta</th>
              <th>Stock</th>
              <th>Estado</th>
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="sku">{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.categoryId ? categoryMap.get(p.categoryId) ?? "—" : "—"}</td>
                {canViewCosts && (
                  <td className="price">
                    {p.purchasePrice ? `$${Number(p.purchasePrice).toFixed(2)}` : "—"}
                  </td>
                )}
                <td className="price">${Number(p.salePrice).toFixed(2)}</td>
                <td
                  className={
                    p.stock <= 0
                      ? "stock-out"
                      : p.stock <= p.minStock
                        ? "stock-low"
                        : ""
                  }
                >
                  {p.stock}
                </td>
                <td>
                  <StockBadge stock={p.stock} minStock={p.minStock} />
                  {!p.isActive && (
                    <span className="badge" style={{ marginLeft: "0.35rem" }}>
                      Inactivo
                    </span>
                  )}
                </td>
                {canEdit && (
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => openEdit(p)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setAdjustProduct(p)}
                    >
                      Stock
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
              await adjustProductStock(token!, adjustProduct.id, payload);
              success(`Stock actualizado: ${adjustProduct.sku}`);
              setAdjustProduct(null);
              await load();
            } catch (err) {
              toastError(err instanceof Error ? err.message : "Error al ajustar");
              throw err;
            }
          }}
        />
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-glass modal-wide"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{editing ? "Editar producto" : "Nuevo producto"}</h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label>
                SKU
                <input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  required
                  disabled={!!editing}
                />
              </label>
              <label>
                Nombre
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label className="form-span-2">
                Descripción
                <input
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label>
                Categoría
                <select
                  value={form.categoryId ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      categoryId: e.target.value || null,
                    })
                  }
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Precio venta
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                  required
                />
              </label>
              {canViewCosts && (
                <label>
                  Precio compra
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(e) =>
                      setForm({ ...form, purchasePrice: e.target.value })
                    }
                    required
                  />
                </label>
              )}
              <label>
                Stock actual
                <input
                  type="number"
                  min="0"
                  value={form.stock ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, stock: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Stock mínimo
                <input
                  type="number"
                  min="0"
                  value={form.minStock ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, minStock: Number(e.target.value) })
                  }
                />
              </label>
              <label className="form-check">
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Producto activo en catálogo
              </label>
              <div className="form-actions form-span-2">
                <button type="button" className="btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
