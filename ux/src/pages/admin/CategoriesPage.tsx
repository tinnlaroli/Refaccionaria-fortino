import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  DataTable,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from "@carbon/react";
import { Add, Edit } from "@carbon/icons-react";
import {
  createCategory,
  fetchCategories,
  slugify,
  updateCategory,
  type Category,
} from "../../api/admin-categories.js";
import { AppModal } from "../../components/carbon/AppModal.js";
import {
  InteractiveTableRow,
  TABLE_ACTIONS_RAIL,
} from "../../components/carbon/InteractiveTableRow.js";
import { ErrorBanner, TableSkeleton } from "../../components/carbon/PageFeedback.js";
import { EmptyState } from "../../components/EmptyState.js";
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
      <div className="fortino-page-actions">
        {canCreate && (
          <Button kind="primary" renderIcon={Add} onClick={openCreate}>
            Agregar categoría
          </Button>
        )}
      </div>

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
        <div className="fortino-interactive-table">
          <DataTable
            rows={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            headers={[
              { key: "name", header: "Nombre" },
              { key: "slug", header: "Identificador web" },
              ...(canEdit ? [TABLE_ACTIONS_RAIL] : []),
            ]}
          >
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHeader
                        {...getHeaderProps({ header: h })}
                        key={h.key}
                        className={h.key === "_rail" ? "fortino-row-actions-cell" : undefined}
                      >
                        {h.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const cat = categories.find((c) => c.id === row.id)!;
                    return (
                      <InteractiveTableRow
                        key={row.id}
                        rowProps={getRowProps({ row })}
                        onOpen={canEdit ? () => openEdit(cat) : undefined}
                        actions={
                          canEdit
                            ? [{ label: "Editar categoría", icon: Edit, onClick: () => openEdit(cat) }]
                            : []
                        }
                        ariaLabel={`Categoría ${cat.name}`}
                      >
                        {row.cells.map((cell) => {
                          if (cell.info.header === "slug") {
                            return (
                              <TableCell key={cell.id} className="mono">
                                {cell.value}
                              </TableCell>
                            );
                          }
                          return <TableCell key={cell.id}>{cell.value}</TableCell>;
                        })}
                      </InteractiveTableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </DataTable>
        </div>
      )}

      <AppModal
        open={modalOpen}
        title={editing ? "Editar categoría" : "Nueva categoría"}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <Stack gap={5}>
          <TextInput
            id="cat-name"
            labelText="Nombre"
            value={name}
            onChange={(e) => {
              const next = blockDigitsInName(e.target.value);
              setName(next);
              if (!editing && !slug) setSlug(slugify(next));
            }}
            onBlur={() => touchField("name")}
            invalid={Boolean(fieldErrors.name)}
            invalidText={fieldErrors.name}
            helperText="Solo letras, sin números"
            required
          />
          <TextInput
            id="cat-slug"
            labelText="Identificador web"
            helperText="Se genera automáticamente desde el nombre (ej. filtros-aceite)"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            onBlur={() => touchField("slug")}
            invalid={Boolean(fieldErrors.slug)}
            invalidText={fieldErrors.slug}
            required
          />
        </Stack>
      </AppModal>
    </div>
  );
}
