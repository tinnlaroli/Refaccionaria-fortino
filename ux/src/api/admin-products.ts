import { apiFetch } from "./client.js";

export type AdminProduct = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  purchasePrice?: string;
  salePrice: string;
  stock: number;
  minStock: number;
  unitOfMeasure?: string;
  brandId?: string | null;
  brandName?: string | null;
  presentation?: string | null;
  vehicleCompatibility?: string | null;
  primaryMediaId?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  updatedAt: string;
};

export type ProductInput = {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string | null;
  purchasePrice: string | number;
  salePrice: string | number;
  stock?: number;
  minStock?: number;
  unitOfMeasure?: string;
  brandId?: string | null;
  brandName?: string | null;
  presentation?: string | null;
  vehicleCompatibility?: string | null;
  primaryMediaId?: string | null;
  isActive?: boolean;
};

export function fetchAdminProducts(
  token: string,
  opts?: { q?: string; lowStock?: boolean },
) {
  const params = new URLSearchParams();
  if (opts?.q?.trim()) params.set("q", opts.q.trim());
  if (opts?.lowStock) params.set("lowStock", "1");
  const query = params.toString();
  const path = query ? `/api/products?${query}` : "/api/products";
  return apiFetch<AdminProduct[]>(path, { token });
}

export function createProduct(token: string, data: ProductInput) {
  return apiFetch<AdminProduct>("/api/products", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateProduct(token: string, id: string, data: Partial<ProductInput>) {
  return apiFetch<AdminProduct>(`/api/products/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export type StockAdjustInput = {
  delta: number;
  reason: "entrada" | "merma" | "devolucion" | "conteo" | "otro";
  note?: string;
};

export function adjustProductStock(token: string, id: string, data: StockAdjustInput) {
  return apiFetch<AdminProduct>(`/api/products/${id}/adjust-stock`, {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}
