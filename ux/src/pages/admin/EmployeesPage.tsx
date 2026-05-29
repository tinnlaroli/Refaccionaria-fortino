import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createEmployee,
  deactivateEmployee,
  fetchEmployees,
  fetchRoles,
  type Employee,
  type Role,
} from "../../api/admin-users.js";
import { EmptyState } from "../../components/EmptyState.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";

export function EmployeesPage() {
  const { token, user } = useAuth();
  const { success } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    roleId: "",
  });

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [list, roleList] = await Promise.all([
        fetchEmployees(token),
        fetchRoles(token),
      ]);
      setEmployees(list);
      setRoles(roleList);
      if (!form.roleId && roleList[0]) {
        setForm((prev) => ({ ...prev, roleId: roleList[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar empleados");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await createEmployee(token, form);
      success("Empleado registrado");
      setModalOpen(false);
      setForm({ email: "", password: "", fullName: "", roleId: roles[0]?.id ?? "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el empleado");
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-actions-bar">
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          + Agregar empleado
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
      ) : employees.length === 0 ? (
        <EmptyState
          title="Sin empleados"
          description="Registra al personal que usará el POS y el panel."
          action={
            <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
              + Agregar empleado
            </button>
          }
        />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.fullName}</td>
                <td>{emp.email}</td>
                <td>{emp.roleName}</td>
                <td>{emp.isActive ? "Activo" : "Inactivo"}</td>
                <td>
                  {emp.isActive && emp.id !== user?.id && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => handleDeactivate(emp)}
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-glass" onClick={(e) => e.stopPropagation()}>
            <h3>Nuevo empleado</h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="form-span-2">
                Nombre completo
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </label>
              <label className="form-span-2">
                Correo
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <label className="form-span-2">
                Contraseña temporal
                <input
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </label>
              <label className="form-span-2">
                Rol
                <select
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.description ? `— ${role.description}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-actions form-span-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setModalOpen(false)}
                >
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
