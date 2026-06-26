import { apiFetch } from "./client.js";

export type Supplier = {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupplierInput = {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export function fetchSuppliers(token: string, q?: string) {
  const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return apiFetch<Supplier[]>(`/api/suppliers${params}`, { token });
}

export function createSupplier(token: string, data: SupplierInput) {
  return apiFetch<Supplier>("/api/suppliers", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateSupplier(token: string, id: string, data: Partial<SupplierInput>) {
  return apiFetch<Supplier>(`/api/suppliers/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}
