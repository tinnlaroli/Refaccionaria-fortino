import { useCallback, useEffect, useState } from "react";
import {
  fetchCategories,
  fetchProducts,
  formatPrice,
  type PublicCategory,
  type PublicProduct,
} from "../api/public";
import { PageHead } from "../components/PageHead";
import { SITE } from "../config/site";

export function CatalogPage() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (search: string, cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const [cats, items] = await Promise.all([
        fetchCategories(),
        fetchProducts({
          q: search || undefined,
          categoryId: cat || undefined,
        }),
      ]);
      setCategories(cats);
      setProducts(items);
    } catch {
      setError(
        "No pudimos cargar el catálogo. Verifica que el sistema esté en línea o intenta más tarde.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(q, categoryId);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [load, q, categoryId]);

  return (
    <>
      <PageHead
        title="Catálogo"
        description={`Piezas y refacciones disponibles en ${SITE.name}, ${SITE.city}.`}
      />
      <section className="section page-intro">
        <div className="container">
          <h1>Catálogo</h1>
          <p className="muted">
            Precios orientativos. La disponibilidad final se confirma en mostrador.
          </p>
          <div className="catalog-toolbar">
            <label className="sr-only" htmlFor="catalog-search">
              Buscar por nombre o SKU
            </label>
            <input
              id="catalog-search"
              type="search"
              className="input"
              placeholder="Buscar por nombre o SKU…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
            <label className="sr-only" htmlFor="catalog-category">
              Categoría
            </label>
            <select
              id="catalog-category"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="section catalog-section" aria-live="polite">
        <div className="container">
          {loading && <p className="muted">Cargando productos…</p>}
          {error && (
            <p className="alert alert-error" role="alert">
              {error}
            </p>
          )}
          {!loading && !error && products.length === 0 && (
            <p className="muted">No hay productos que coincidan con tu búsqueda.</p>
          )}
          {!loading && !error && products.length > 0 && (
            <div className="catalog-table-wrap">
              <table className="catalog-table">
                <thead>
                  <tr>
                    <th scope="col">SKU</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Precio</th>
                    <th scope="col">Disponibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="sku">{p.sku}</td>
                      <td>
                        <strong>{p.name}</strong>
                        {p.description && (
                          <span className="product-desc">{p.description}</span>
                        )}
                      </td>
                      <td className="price">{formatPrice(p.salePrice)}</td>
                      <td>
                        {!p.inStock ? (
                          <span className="badge badge-muted">Agotado</span>
                        ) : p.lowStock ? (
                          <span className="badge badge-warning">Pocas piezas</span>
                        ) : (
                          <span className="badge badge-ok">Disponible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
