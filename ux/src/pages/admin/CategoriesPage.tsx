import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createCategory,
  fetchCategories,
  slugify,
  updateCategory,
  type Category,
} from "../../api/admin-categories.js";
import { EmptyState } from "../../components/EmptyState.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";

export function CategoriesPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission("products.create");
  const canEdit = hasPermission("products.edit");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      setCategories(await fetchCategories(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar categorías");
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
  }, [searchParams, canCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setName("");
    setSlug("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
      };
      if (editing) {
        await updateCategory(token, editing.id, payload);
        success("Categoría actualizada");
      } else {
        await createCategory(token, payload);
        success("Categoría creada");
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la categoría");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-actions-bar">
        {canCreate && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            + Agregar categoría
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
      ) : categories.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description={
            canCreate
              ? "Crea la primera para organizar el catálogo."
              : "Aún no hay categorías registradas."
          }
          action={
            canCreate ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                + Agregar categoría
              </button>
            ) : undefined
          }
        />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td className="mono">{cat.slug}</td>
                {canEdit && (
                  <td>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => openEdit(cat)}
                    >
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-glass" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Editar categoría" : "Nueva categoría"}</h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="form-span-2">
                Nombre
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editing && !slug) setSlug(slugify(e.target.value));
                  }}
                  required
                />
              </label>
              <label className="form-span-2">
                Slug (URL)
                <input
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  required
                />
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
