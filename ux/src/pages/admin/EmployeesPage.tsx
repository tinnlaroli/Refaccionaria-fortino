import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  DataTable,
  PasswordInput,
  Select,
  SelectItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  TextInput,
} from "@carbon/react";
import { Add } from "@carbon/icons-react";
import { UserMinusIcon } from "../../components/icons/UserMinusIcon.js";
import {
  createEmployee,
  deactivateEmployee,
  fetchEmployees,
  fetchRoles,
  type Employee,
  type Role,
} from "../../api/admin-users.js";
import { AppModal } from "../../components/carbon/AppModal.js";
import {
  InteractiveTableRow,
  TABLE_ACTIONS_RAIL,
} from "../../components/carbon/InteractiveTableRow.js";
import { ErrorBanner, TableSkeleton } from "../../components/carbon/PageFeedback.js";
import { EmptyState } from "../../components/EmptyState.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { getErrorMessage } from "../../lib/errors.js";
import { blockDigitsInName, email, nameField, password, required } from "../../lib/validation.js";

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
      <div className="fortino-page-actions">
        <Button kind="primary" renderIcon={Add} onClick={() => setModalOpen(true)}>
          Agregar empleado
        </Button>
      </div>

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
        <div className="fortino-interactive-table">
          <DataTable
            rows={employees.map((e) => ({
              id: e.id,
              name: e.fullName,
              email: e.email,
              role: ROLE_NAMES[e.roleName] ?? e.roleName,
              status: e.isActive ? "Activo" : "Inactivo",
            }))}
            headers={[
              { key: "name", header: "Nombre" },
              { key: "email", header: "Correo" },
              { key: "role", header: "Rol" },
              { key: "status", header: "Estado" },
              TABLE_ACTIONS_RAIL,
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
                    const emp = employees.find((e) => e.id === row.id)!;
                    const canDeactivate = emp.isActive && emp.id !== user?.id;
                    return (
                      <InteractiveTableRow
                        key={row.id}
                        rowProps={getRowProps({ row })}
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
                        {row.cells.map((cell) => {
                          if (cell.info.header === "status") {
                            return (
                              <TableCell key={cell.id}>
                                <Tag type={emp.isActive ? "green" : "gray"} size="sm">
                                  {cell.value}
                                </Tag>
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
        title="Nuevo empleado"
        subtitle="Asigna rol y contraseña temporal"
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <Stack gap={5}>
          <TextInput
            id="emp-name"
            labelText="Nombre completo"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: blockDigitsInName(e.target.value) })}
            onBlur={() => touchField("fullName")}
            invalid={Boolean(fieldErrors.fullName)}
            invalidText={fieldErrors.fullName}
            helperText="Solo letras, sin números"
            required
          />
          <TextInput
            id="emp-email"
            labelText="Correo"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value.trim().toLowerCase() })}
            onBlur={() => touchField("email")}
            invalid={Boolean(fieldErrors.email)}
            invalidText={fieldErrors.email}
            required
          />
          <PasswordInput
            id="emp-password"
            labelText="Contraseña temporal"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onBlur={() => touchField("password")}
            invalid={Boolean(fieldErrors.password)}
            invalidText={fieldErrors.password}
            helperText="Mínimo 6 caracteres, sin espacios"
            required
          />
          <Select
            id="emp-role"
            labelText="Rol"
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            invalid={Boolean(fieldErrors.roleId)}
            invalidText={fieldErrors.roleId}
          >
            {roles.map((role) => (
              <SelectItem
                key={role.id}
                value={role.id}
                text={`${ROLE_NAMES[role.name] ?? role.name}${role.description ? ` — ${role.description}` : ""}`}
              />
            ))}
          </Select>
        </Stack>
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
          <Stack gap={4}>
            <p className="cds--body-compact-01" style={{ margin: 0 }}>
              <strong>Nombre:</strong> {selected.fullName}
            </p>
            <p className="cds--body-compact-01" style={{ margin: 0 }}>
              <strong>Rol:</strong> {ROLE_NAMES[selected.roleName] ?? selected.roleName}
            </p>
            <Tag type={selected.isActive ? "green" : "gray"} size="md">
              {selected.isActive ? "Activo" : "Inactivo"}
            </Tag>
          </Stack>
        )}
      </AppModal>
    </div>
  );
}
