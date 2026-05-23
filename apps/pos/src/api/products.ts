import { db } from "../db/dexie.js";
import type { Product } from "../types/index.js";
import { apiFetch } from "./client.js";

export async function fetchProductsOnline(token: string, q = "") {
  const path = q
    ? `/api/products?q=${encodeURIComponent(q)}`
    : "/api/products";
  const list = await apiFetch<Product[]>(path, { token });
  await db.products.bulkPut(
    list.map((p) => ({
      ...p,
      updatedAt:
        typeof p.updatedAt === "string"
          ? p.updatedAt
          : new Date().toISOString(),
    })),
  );
  return list;
}

export async function searchProductsLocal(q: string) {
  const lower = q.toLowerCase().trim();
  if (!lower) {
    return db.products.filter((p) => p.isActive).limit(100).toArray();
  }
  return db.products
    .filter(
      (p) =>
        p.isActive &&
        (p.sku.toLowerCase().includes(lower) ||
          p.name.toLowerCase().includes(lower)),
    )
    .limit(50)
    .toArray();
}

export async function findBySku(sku: string) {
  const normalized = sku.trim().toUpperCase();
  const exact = await db.products.where("sku").equals(normalized).first();
  if (exact) return exact;
  return db.products
    .filter((p) => p.sku.toUpperCase() === normalized)
    .first();
}
