import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Table } from "@heroui/react";
import { Plus, Pencil } from "lucide-react";
import {
  createCategory,
  fetchCategories,
  slugify,
  updateCategory,
  type Category,
} from "../../api/admin-categories.js";
import { AppModal } from "../../components/ui/AppModal.js";
import { EmptyState } from "../../components/EmptyState.js";
import { InteractiveTableRow } from "../../components/ui/InteractiveTableRow.js";
import { ErrorBanner, TableSkeleton } from "../../components/ui/PageFeedback.js";
import { DataPanel } from "../../components/ui/DataPanel.js";
import { PageToolbar, PageToolbarGroup } from "../../components/ui/PageToolbar.js";
import { EX } from "../../config/fieldExamples.js";
import { FortinoTextField } from "../../components/ui/FortinoTextField.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { getErrorMessage } from "../../lib/errors.js";
import { nameField, slug as validateSlug, blockDigitsInName } from "../../lib/validation.js";

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
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; slug?: string }>({});
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission("products.create");
  const canEdit = hasPermission("products.edit");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      setCategories(await fetchCategories(token));
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar categorías"));
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
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setFieldErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setName("");
    setSlug("");
    setFieldErrors({});
  };

  const getErrors = () => ({
    name: nameField(name, "Nombre"),
    slug: validateSlug(slug.trim() || slugify(name)),
  });

  const validate = () => {
    const next = getErrors();
    setFieldErrors(next);
    return !next.name && !next.slug;
  };

  const touchField = (field: "name" | "slug") => {
    const msg = getErrors()[field];
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleSubmit = async () => {
    if (!token || !validate()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), slug: slug.trim() || slugify(name) };
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
      setFieldErrors({ name: getErrorMessage(err, "No se pudo guardar") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fortino-admin-page">
      <PageToolbar>
        <PageToolbarGroup grow>
          <p className="m-0 text-sm text-muted">{categories.length} categoría(s)</p>
        </PageToolbarGroup>
        {canCreate && (
          <PageToolbarGroup>
            <Button variant="primary" onPress={openCreate}>
              <Plus size={16} />
              Agregar categoría
            </Button>
          </PageToolbarGroup>
        )}
      </PageToolbar>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : categories.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description={
            canCreate
              ? "Crea la primera para organizar el catálogo."
              : "Aún no hay categorías registradas."
          }
          actionLabel={canCreate ? "Agregar categoría" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <DataPanel title="Categorías del catálogo" description="Organiza refacciones por tipo" compact>
          <div className="fortino-interactive-table">
          <Table aria-label="Categorías">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>Nombre</Table.Column>
                  <Table.Column>Identificador web</Table.Column>
                  {canEdit && <Table.Column className="fortino-row-actions-cell" />}
                </Table.Header>
                <Table.Body>
                  {categories.map((cat) => (
                    <InteractiveTableRow
                      key={cat.id}
                      id={cat.id}
                      reserveActionsColumn={canEdit}
                      onOpen={canEdit ? () => openEdit(cat) : undefined}
                      actions={
                        canEdit
                          ? [{ label: "Editar categoría", icon: Pencil, onClick: () => openEdit(cat) }]
                          : []
                      }
                      ariaLabel={`Categoría ${cat.name}`}
                    >
                      <Table.Cell>{cat.name}</Table.Cell>
                      <Table.Cell className="mono">{cat.slug}</Table.Cell>
                    </InteractiveTableRow>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
        </DataPanel>
      )}

      <AppModal
        open={modalOpen}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        subtitle={
          editing
            ? "Actualiza el nombre visible y el identificador web"
            : "Agrupa productos por tipo de refacción"
        }
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <div className="flex flex-col gap-5">
          <FortinoTextField
            id="cat-name"
            label="Nombre de la categoría"
            placeholder={EX.categoryName}
            value={name}
            onChange={(next) => {
              const v = blockDigitsInName(next);
              setName(v);
              if (!editing && !slug) setSlug(slugify(v));
            }}
            onBlur={() => touchField("name")}
            error={fieldErrors.name}
            helperText="Solo letras, sin números"
            required
          />
          <FortinoTextField
            id="cat-slug"
            label="Identificador web (slug)"
            placeholder={EX.categorySlug}
            helperText="Se genera solo al crear; minúsculas y guiones"
            value={slug}
            onChange={(next) => setSlug(slugify(next))}
            onBlur={() => touchField("slug")}
            error={fieldErrors.slug}
            required
          />
        </div>
      </AppModal>
    </div>
  );
}
