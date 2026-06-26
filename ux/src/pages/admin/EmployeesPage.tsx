import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Chip, Table } from "@heroui/react";
import { Plus } from "lucide-react";
import { UserMinusIcon } from "../../components/icons/UserMinusIcon.js";
import {
  createEmployee,
  deactivateEmployee,
  fetchEmployees,
  fetchRoles,
  type Employee,
  type Role,
} from "../../api/admin-users.js";
import { AppModal } from "../../components/ui/AppModal.js";
import { EmptyState } from "../../components/EmptyState.js";
import { InteractiveTableRow } from "../../components/ui/InteractiveTableRow.js";
import { ErrorBanner, TableSkeleton } from "../../components/ui/PageFeedback.js";
import { DataPanel } from "../../components/ui/DataPanel.js";
import { PageToolbar, PageToolbarGroup } from "../../components/ui/PageToolbar.js";
import { EX } from "../../config/fieldExamples.js";
import { DetailList } from "../../components/ui/DetailList.js";
import { FortinoTextField } from "../../components/ui/FortinoTextField.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { getErrorMessage } from "../../lib/errors.js";
import { blockDigitsInName, email, nameField, password, required } from "../../lib/validation.js";

const SELECT_CLASS =
  "w-full rounded-lg border border-default-200 bg-background px-3 py-2 text-sm";

const ROLE_NAMES: Record<string, string> = {
  admin: "Administrador",
  cashier: "Cajero",
  viewer: "Consulta",
};

type FormFields = "fullName" | "email" | "password" | "roleId";

export function EmployeesPage() {
  const { token, user } = useAuth();
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", roleId: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormFields, string>>>({});

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [list, roleList] = await Promise.all([fetchEmployees(token), fetchRoles(token)]);
      setEmployees(list);
      setRoles(roleList);
      if (!form.roleId && roleList[0]) {
        setForm((prev) => ({ ...prev, roleId: roleList[0].id }));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar empleados"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setModalOpen(true);
      searchParams.delete("nuevo");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const getErrors = () => ({
    fullName: nameField(form.fullName, "Nombre completo"),
    email: email(form.email),
    password: password(form.password),
    roleId: required(form.roleId, "El rol"),
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
      await createEmployee(token, form);
      success("Empleado registrado");
      setModalOpen(false);
      setForm({ email: "", password: "", fullName: "", roleId: roles[0]?.id ?? "" });
      setFieldErrors({});
      await load();
    } catch (err) {
      setFieldErrors({ email: getErrorMessage(err, "No se pudo crear el empleado") });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (employee: Employee) => {
    if (!token || employee.id === user?.id) return;
    if (!window.confirm(`¿Desactivar a ${employee.fullName}?`)) return;
    try {
      await deactivateEmployee(token, employee.id);
      success(`${employee.fullName} desactivado`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo desactivar"));
    }
  };

  return (
    <div className="fortino-admin-page">
      <PageToolbar>
        <PageToolbarGroup grow>
          <p className="m-0 text-sm text-muted">{employees.length} empleado(s) registrado(s)</p>
        </PageToolbarGroup>
        <PageToolbarGroup>
          <Button variant="primary" onPress={() => setModalOpen(true)}>
            <Plus size={16} />
            Agregar empleado
          </Button>
        </PageToolbarGroup>
      </PageToolbar>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : employees.length === 0 ? (
        <EmptyState
          title="Sin empleados"
          description="Registra al personal que usará el POS y el panel."
          actionLabel="Agregar empleado"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <DataPanel title="Equipo" description="Accesos al POS y panel administrativo" compact>
          <div className="fortino-interactive-table">
          <Table aria-label="Empleados">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>Nombre</Table.Column>
                  <Table.Column>Correo</Table.Column>
                  <Table.Column>Rol</Table.Column>
                  <Table.Column>Estado</Table.Column>
                  <Table.Column className="fortino-row-actions-cell" />
                </Table.Header>
                <Table.Body>
                  {employees.map((emp) => {
                    const canDeactivate = emp.isActive && emp.id !== user?.id;
                    return (
                      <InteractiveTableRow
                        key={emp.id}
                        id={emp.id}
                        reserveActionsColumn
                        onOpen={() => setSelected(emp)}
                        actions={
                          canDeactivate
                            ? [
                                {
                                  label: "Desactivar empleado",
                                  icon: UserMinusIcon,
                                  onClick: () => handleDeactivate(emp),
                                },
                              ]
                            : []
                        }
                        ariaLabel={`Empleado ${emp.fullName}`}
                      >
                        <Table.Cell>{emp.fullName}</Table.Cell>
                        <Table.Cell>{emp.email}</Table.Cell>
                        <Table.Cell>{ROLE_NAMES[emp.roleName] ?? emp.roleName}</Table.Cell>
                        <Table.Cell>
                          <Chip color={emp.isActive ? "success" : "default"} size="sm">
                            <Chip.Label>{emp.isActive ? "Activo" : "Inactivo"}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                      </InteractiveTableRow>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
        </DataPanel>
      )}

      <AppModal
        open={modalOpen}
        title="Nuevo empleado"
        subtitle="El colaborador recibirá acceso al mostrador o al panel según su rol"
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <div className="flex flex-col gap-5">
          <FortinoTextField
            id="emp-name"
            label="Nombre completo del colaborador"
            placeholder={EX.employeeName}
            value={form.fullName}
            onChange={(next) => setForm({ ...form, fullName: blockDigitsInName(next) })}
            onBlur={() => touchField("fullName")}
            error={fieldErrors.fullName}
            helperText="Solo letras, sin números"
            required
          />
          <FortinoTextField
            id="emp-email"
            label="Correo de acceso"
            placeholder={EX.employeeEmail}
            type="email"
            value={form.email}
            onChange={(next) => setForm({ ...form, email: next.trim().toLowerCase() })}
            onBlur={() => touchField("email")}
            error={fieldErrors.email}
            required
          />
          <FortinoTextField
            id="emp-password"
            label="Contraseña temporal inicial"
            placeholder={EX.employeePassword}
            type="password"
            value={form.password}
            onChange={(next) => setForm({ ...form, password: next })}
            onBlur={() => touchField("password")}
            error={fieldErrors.password}
            helperText="Mínimo 6 caracteres, sin espacios"
            required
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="emp-role" className="text-sm font-medium">
              Rol y permisos
            </label>
            <select
              id="emp-role"
              className={SELECT_CLASS}
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {ROLE_NAMES[role.name] ?? role.name}
                  {role.description ? ` — ${role.description}` : ""}
                </option>
              ))}
            </select>
            {fieldErrors.roleId && (
              <p className="text-sm text-danger">{fieldErrors.roleId}</p>
            )}
          </div>
        </div>
      </AppModal>

      <AppModal
        open={Boolean(selected)}
        title="Detalle del empleado"
        subtitle={selected?.email}
        onClose={() => setSelected(null)}
        onSubmit={
          selected && selected.isActive && selected.id !== user?.id
            ? () => handleDeactivate(selected)
            : undefined
        }
        submitLabel="Desactivar"
        danger
        cancelLabel="Cerrar"
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <DetailList
              items={[
                { label: "Nombre completo", value: selected.fullName },
                { label: "Correo de acceso", value: selected.email },
                {
                  label: "Rol asignado",
                  value: ROLE_NAMES[selected.roleName] ?? selected.roleName,
                },
                {
                  label: "Estado de la cuenta",
                  value: (
                    <Chip color={selected.isActive ? "success" : "default"} size="sm">
                      <Chip.Label>{selected.isActive ? "Activo" : "Inactivo"}</Chip.Label>
                    </Chip>
                  ),
                },
              ]}
            />
          </div>
        )}
      </AppModal>
    </div>
  );
}
