import { apiFetch } from "./client.js";

export type Brand = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export function fetchBrands(token: string, q?: string) {
  const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return apiFetch<Brand[]>(`/api/brands${params}`, { token });
}

export function createBrand(token: string, data: { name: string; slug: string }) {
  return apiFetch<Brand>("/api/brands", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateBrand(
  token: string,
  id: string,
  data: Partial<{ name: string; slug: string; isActive: boolean }>,
) {
  return apiFetch<Brand>(`/api/brands/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export function slugifyBrand(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
