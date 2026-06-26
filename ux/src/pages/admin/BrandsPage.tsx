import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Chip, Switch, Table } from "@heroui/react";
import { Plus, Pencil } from "lucide-react";
import {
  createBrand,
  fetchBrands,
  slugifyBrand,
  updateBrand,
  type Brand,
} from "../../api/admin-brands.js";
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

export function BrandsPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; slug?: string }>({});
  const [saving, setSaving] = useState(false);

  const canManage = hasPermission("brands.manage");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      setBrands(await fetchBrands(token));
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar marcas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("nuevo") === "1" && canManage) {
      openCreate();
      searchParams.delete("nuevo");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, canManage]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setIsActive(true);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setIsActive(brand.isActive);
    setFieldErrors({});
    setModalOpen(true);
  };

  const getErrors = () => ({
    name: nameField(name, "Nombre"),
    slug: validateSlug(slug.trim() || slugifyBrand(name)),
  });

  const handleSubmit = async () => {
    if (!token) return;
    const next = getErrors();
    setFieldErrors(next);
    if (next.name || next.slug) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), slug: slug.trim() || slugifyBrand(name) };
      if (editing) {
        await updateBrand(token, editing.id, { ...payload, isActive });
        success("Marca actualizada");
      } else {
        await createBrand(token, payload);
        success("Marca creada");
      }
      setModalOpen(false);
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
          <p className="m-0 text-sm text-muted">{brands.length} marca(s) registrada(s)</p>
        </PageToolbarGroup>
        {canManage && (
          <PageToolbarGroup>
            <Button variant="primary" onPress={openCreate}>
              <Plus size={16} />
              Nueva marca
            </Button>
          </PageToolbarGroup>
        )}
      </PageToolbar>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : brands.length === 0 ? (
        <EmptyState
          title="Sin marcas"
          description="Registra marcas para asignarlas a productos del catálogo."
          actionLabel={canManage ? "Agregar marca" : undefined}
          onAction={canManage ? openCreate : undefined}
        />
      ) : (
        <DataPanel title="Marcas" description="Catálogo reutilizable en productos" compact>
          <div className="fortino-interactive-table">
            <Table aria-label="Marcas">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader>Nombre</Table.Column>
                    <Table.Column>Identificador</Table.Column>
                    <Table.Column>Estado</Table.Column>
                    {canManage && <Table.Column className="fortino-row-actions-cell" />}
                  </Table.Header>
                  <Table.Body>
                    {brands.map((brand) => (
                      <InteractiveTableRow
                        key={brand.id}
                        id={brand.id}
                        reserveActionsColumn={canManage}
                        onOpen={canManage ? () => openEdit(brand) : undefined}
                        actions={
                          canManage
                            ? [{ label: "Editar marca", icon: Pencil, onClick: () => openEdit(brand) }]
                            : []
                        }
                        ariaLabel={`Marca ${brand.name}`}
                      >
                        <Table.Cell>{brand.name}</Table.Cell>
                        <Table.Cell className="mono">{brand.slug}</Table.Cell>
                        <Table.Cell>
                          <Chip size="sm" color={brand.isActive ? "success" : "default"}>
                            <Chip.Label>{brand.isActive ? "Activa" : "Inactiva"}</Chip.Label>
                          </Chip>
                        </Table.Cell>
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
        title={editing ? "Editar marca" : "Nueva marca"}
        subtitle={
          editing
            ? "Las marcas inactivas no aparecen al crear productos"
            : "Fabricante reutilizable en el catálogo de productos"
        }
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <div className="flex flex-col gap-4">
          <FortinoTextField
            id="brand-name"
            label="Nombre comercial de la marca"
            placeholder={EX.brandName}
            value={name}
            onChange={(v) => {
              setName(blockDigitsInName(v));
              if (!editing) setSlug(slugifyBrand(v));
            }}
            error={fieldErrors.name}
            required
          />
          <FortinoTextField
            id="brand-slug"
            label="Identificador web (slug)"
            placeholder={EX.brandSlug}
            value={slug}
            onChange={(v) => setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            error={fieldErrors.slug}
            helperText="Minúsculas, números y guiones"
            required
          />
          {editing && (
            <Switch isSelected={isActive} onChange={setIsActive}>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              Marca activa
            </Switch>
          )}
        </div>
      </AppModal>
    </div>
  );
}
