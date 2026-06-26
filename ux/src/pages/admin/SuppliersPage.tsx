import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Chip, SearchField, Switch, Table } from "@heroui/react";
import { Plus, Pencil } from "lucide-react";
import {
  createSupplier,
  fetchSuppliers,
  updateSupplier,
  type Supplier,
  type SupplierInput,
} from "../../api/admin-suppliers.js";
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
import { blockDigitsInName, email, nameField } from "../../lib/validation.js";

type FormFields = "name" | "contactName" | "email";

const emptyForm: SupplierInput = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  isActive: true,
};

export function SuppliersPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierInput>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormFields, string>>>({});
  const [saving, setSaving] = useState(false);

  const canManage = hasPermission("suppliers.manage");

  const load = async (q = filter) => {
    if (!token) return;
    setLoading(true);
    try {
      setSuppliers(await fetchSuppliers(token, q.trim() || undefined));
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar proveedores"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(filter), 200);
    return () => clearTimeout(t);
  }, [token, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("nuevo") === "1" && canManage) {
      openCreate();
      searchParams.delete("nuevo");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, canManage]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName ?? "",
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
      notes: supplier.notes ?? "",
      isActive: supplier.isActive,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
  };

  const getErrors = () => ({
    name: nameField(form.name, "Nombre"),
    contactName: form.contactName?.trim()
      ? nameField(form.contactName, "Contacto")
      : undefined,
    email: form.email?.trim() ? email(form.email) : undefined,
  });

  const validate = () => {
    const next = getErrors();
    setFieldErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const touchField = (field: FormFields) => {
    const msg = getErrors()[field];
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleSubmit = async () => {
    if (!token || !validate()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: SupplierInput = {
        name: form.name.trim(),
        contactName: form.contactName?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
        notes: form.notes?.trim() || null,
        isActive: form.isActive ?? true,
      };
      if (editing) {
        await updateSupplier(token, editing.id, payload);
        success("Proveedor actualizado");
      } else {
        await createSupplier(token, payload);
        success("Proveedor registrado");
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
          <SearchField
            aria-label="Buscar proveedores"
            value={filter}
            onChange={setFilter}
            className="fortino-page-toolbar__grow"
          >
            <SearchField.Group>
              <SearchField.Input placeholder="Nombre, contacto o correo…" />
            </SearchField.Group>
          </SearchField>
        </PageToolbarGroup>
        {canManage && (
          <PageToolbarGroup>
            <Button variant="primary" onPress={openCreate}>
              <Plus size={16} />
              Agregar proveedor
            </Button>
          </PageToolbarGroup>
        )}
      </PageToolbar>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="Sin proveedores"
          description={
            canManage
              ? "Registra proveedores para vincular compras e inventario."
              : "Aún no hay proveedores registrados."
          }
          actionLabel={canManage ? "Agregar proveedor" : undefined}
          onAction={canManage ? openCreate : undefined}
        />
      ) : (
        <DataPanel
          title="Proveedores"
          description={`${suppliers.length} proveedor(es) registrado(s)`}
          compact
        >
          <div className="fortino-interactive-table">
            <Table aria-label="Proveedores">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader>Nombre</Table.Column>
                    <Table.Column>Contacto</Table.Column>
                    <Table.Column>Teléfono</Table.Column>
                    <Table.Column>Correo</Table.Column>
                    <Table.Column>Estado</Table.Column>
                    {canManage && <Table.Column className="fortino-row-actions-cell" />}
                  </Table.Header>
                  <Table.Body>
                    {suppliers.map((supplier) => (
                      <InteractiveTableRow
                        key={supplier.id}
                        id={supplier.id}
                        reserveActionsColumn={canManage}
                        onOpen={canManage ? () => openEdit(supplier) : undefined}
                        actions={
                          canManage
                            ? [
                                {
                                  label: "Editar proveedor",
                                  icon: Pencil,
                                  onClick: () => openEdit(supplier),
                                },
                              ]
                            : []
                        }
                        ariaLabel={`Proveedor ${supplier.name}`}
                      >
                        <Table.Cell>{supplier.name}</Table.Cell>
                        <Table.Cell>{supplier.contactName ?? "—"}</Table.Cell>
                        <Table.Cell>{supplier.phone ?? "—"}</Table.Cell>
                        <Table.Cell>{supplier.email ?? "—"}</Table.Cell>
                        <Table.Cell>
                          <Chip color={supplier.isActive ? "success" : "default"} size="sm">
                            <Chip.Label>{supplier.isActive ? "Activo" : "Inactivo"}</Chip.Label>
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
        title={editing ? "Editar proveedor" : "Nuevo proveedor"}
        subtitle="Datos de contacto para compras y seguimiento de entregas"
        size="lg"
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <div className="flex flex-col gap-5">
          <FortinoTextField
            id="supplier-name"
            label="Razón social o nombre"
            placeholder={EX.supplierName}
            value={form.name}
            onChange={(next) => setForm((prev) => ({ ...prev, name: blockDigitsInName(next) }))}
            onBlur={() => touchField("name")}
            error={fieldErrors.name}
            required
          />
          <FortinoTextField
            id="supplier-contact"
            label="Persona de contacto"
            placeholder={EX.supplierContact}
            value={form.contactName ?? ""}
            onChange={(next) =>
              setForm((prev) => ({ ...prev, contactName: blockDigitsInName(next) }))
            }
            onBlur={() => touchField("contactName")}
            error={fieldErrors.contactName}
          />
          <FortinoTextField
            id="supplier-email"
            label="Correo electrónico"
            placeholder={EX.supplierEmail}
            type="email"
            value={form.email ?? ""}
            onChange={(next) => setForm((prev) => ({ ...prev, email: next }))}
            onBlur={() => touchField("email")}
            error={fieldErrors.email}
          />
          <FortinoTextField
            id="supplier-phone"
            label="Teléfono de contacto"
            placeholder={EX.supplierPhone}
            value={form.phone ?? ""}
            onChange={(next) => setForm((prev) => ({ ...prev, phone: next }))}
          />
          <FortinoTextField
            id="supplier-address"
            label="Dirección fiscal o bodega"
            placeholder={EX.supplierAddress}
            value={form.address ?? ""}
            onChange={(next) => setForm((prev) => ({ ...prev, address: next }))}
          />
          <FortinoTextField
            id="supplier-notes"
            label="Notas internas"
            placeholder={EX.supplierNotes}
            value={form.notes ?? ""}
            onChange={(next) => setForm((prev) => ({ ...prev, notes: next }))}
          />
          {editing && (
            <Switch
              isSelected={form.isActive ?? true}
              onChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Content>
                <span className="text-sm">Proveedor activo</span>
              </Switch.Content>
            </Switch>
          )}
        </div>
      </AppModal>
    </div>
  );
}
