import { categories, products } from "@refaccionaria/db";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  const list = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(categories.name);

  res.json(list);
});

router.get("/products", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const categoryId =
    typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;

  const conditions = [eq(products.isActive, true)];
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  if (q) {
    conditions.push(
      or(ilike(products.sku, `%${q}%`), ilike(products.name, `%${q}%`)),
    );
  }

  const list = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      salePrice: products.salePrice,
      stock: products.stock,
      minStock: products.minStock,
      categoryId: products.categoryId,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.updatedAt))
    .limit(100);

  res.json(
    list.map((p) => ({
      ...p,
      salePrice: String(p.salePrice),
      inStock: p.stock > 0,
      lowStock: p.stock > 0 && p.stock <= p.minStock,
    })),
  );
});

export default router;
