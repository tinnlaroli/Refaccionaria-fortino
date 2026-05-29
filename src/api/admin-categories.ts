import { apiFetch } from "./client.js";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export function fetchCategories(token: string) {
  return apiFetch<Category[]>("/api/categories", { token });
}

export function createCategory(token: string, data: { name: string; slug: string }) {
  return apiFetch<Category>("/api/categories", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateCategory(
  token: string,
  id: string,
  data: Partial<{ name: string; slug: string }>,
) {
  return apiFetch<Category>(`/api/categories/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export { slugify };
