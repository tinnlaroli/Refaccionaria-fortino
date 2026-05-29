import { apiFetch } from "./client.js";

export type Employee = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  roleId: string;
  roleName: string;
  createdAt: string;
};

export type Role = {
  id: string;
  name: string;
  description: string | null;
};

export type EmployeeInput = {
  email: string;
  password: string;
  fullName: string;
  roleId: string;
};

export function fetchEmployees(token: string) {
  return apiFetch<Employee[]>("/api/users", { token });
}

export function fetchRoles(token: string) {
  return apiFetch<Role[]>("/api/roles", { token });
}

export function createEmployee(token: string, data: EmployeeInput) {
  return apiFetch<Employee>("/api/users", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function deactivateEmployee(token: string, id: string) {
  return apiFetch<Employee>(`/api/users/${id}/deactivate`, {
    method: "PATCH",
    token,
  });
}
