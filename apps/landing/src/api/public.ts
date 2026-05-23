export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicProduct = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  salePrice: string;
  stock: number;
  inStock: boolean;
  lowStock: boolean;
  categoryId: string | null;
};

export async function fetchCategories(): Promise<PublicCategory[]> {
  const res = await fetch("/api/public/categories");
  if (!res.ok) throw new Error("No se pudo cargar categorías");
  return res.json();
}

export async function fetchProducts(params?: {
  q?: string;
  categoryId?: string;
}): Promise<PublicProduct[]> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.categoryId) search.set("categoryId", params.categoryId);
  const qs = search.toString();
  const res = await fetch(`/api/public/products${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("No se pudo cargar el catálogo");
  return res.json();
}

export function formatPrice(value: string): string {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}
