import { brands, mediaAssets, products } from "@refaccionaria/db";
import { desc, eq, ilike, or, and, sql, getTableColumns } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import {
  descriptionZod,
  formatZodError,
  moneyZod,
  nameZod,
  nonNegativeIntZod,
  skuZod,
} from "../lib/field-validators.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();
const productColumns = getTableColumns(products);

async function queryProducts(whereClause, orderBy, limit) {
  let query = db
    .select({
      ...productColumns,
      imageUrl: mediaAssets.url,
      brandName: brands.name,
    })
    .from(products)
    .leftJoin(mediaAssets, eq(products.primaryMediaId, mediaAssets.id))
    .leftJoin(brands, eq(products.brandId, brands.id));
  if (whereClause) {
    query = query.where(whereClause);
  }
  return query.orderBy(orderBy).limit(limit);
}

const productSchema = z.object({
  sku: skuZod(),
  name: nameZod("Nombre del producto"),
  description: descriptionZod(),
  categoryId: z.string().uuid().optional().nullable(),
  purchasePrice: moneyZod("Precio de compra"),
  salePrice: moneyZod("Precio de venta"),
  stock: nonNegativeIntZod("Stock").optional(),
  minStock: nonNegativeIntZod("Stock mínimo").optional(),
  unitOfMeasure: z.string().trim().min(1).max(12).optional(),
  brandId: z.string().uuid().optional().nullable(),
  presentation: z.string().trim().max(120).optional().nullable(),
  vehicleCompatibility: z.string().trim().max(500).optional().nullable(),
  primaryMediaId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

router.get("/", requireAuth, requirePermission("products.view"), async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const lowStock = req.query.lowStock === "1" || req.query.lowStock === "true";
  const list = lowStock
    ? await queryProducts(
        and(eq(products.isActive, true), sql`${products.stock} <= ${products.minStock}`),
        products.stock,
        100,
      )
    : q
      ? await queryProducts(
          or(ilike(products.sku, `%${q}%`), ilike(products.name, `%${q}%`)),
          desc(products.updatedAt),
          50,
        )
      : await queryProducts(undefined, desc(products.updatedAt), 100);

  const mapped = list.map((p) => ({
    ...p,
    purchasePrice: req.user?.permissions.includes("products.view_costs")
      ? p.purchasePrice
      : undefined,
  }));

  res.json(mapped);
});

async function productWithMedia(product, includeCosts) {
  let imageUrl = null;
  if (product.primaryMediaId) {
    const [media] = await db
      .select({ url: mediaAssets.url })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, product.primaryMediaId))
      .limit(1);
    imageUrl = media?.url ?? null;
  }
  return {
    ...product,
    imageUrl,
    purchasePrice: includeCosts ? product.purchasePrice : undefined,
  };
}

router.get("/sku/:sku", requireAuth, requirePermission("products.view"), async (req, res) => {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.sku, String(req.params.sku)))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Producto no encontrado" });
    return;
  }

  res.json(await productWithMedia(product, req.user?.permissions.includes("products.view_costs")));
});

router.post(
  "/",
  requireAuth,
  requirePermission("products.create"),
  async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const [created] = await db
      .insert(products)
      .values({
        ...parsed.data,
        purchasePrice: String(parsed.data.purchasePrice),
        salePrice: String(parsed.data.salePrice),
        stock: parsed.data.stock ?? 0,
        minStock: parsed.data.minStock ?? 0,
        unitOfMeasure: parsed.data.unitOfMeasure ?? "PZA",
        brandId: parsed.data.brandId ?? null,
        presentation: parsed.data.presentation ?? null,
        vehicleCompatibility: parsed.data.vehicleCompatibility ?? null,
        primaryMediaId: parsed.data.primaryMediaId ?? null,
      })
      .returning();

    await logAudit({
      userId: req.user.sub,
      action: "product.create",
      entityType: "product",
      entityId: created.id,
      payload: { sku: created.sku },
    });

    res.status(201).json(created);
  },
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("products.edit"),
  async (req, res) => {
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const data = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
    if (parsed.data.sku !== undefined) data.sku = parsed.data.sku;
    if (parsed.data.categoryId !== undefined) data.categoryId = parsed.data.categoryId;
    if (parsed.data.stock !== undefined) data.stock = parsed.data.stock;
    if (parsed.data.minStock !== undefined) data.minStock = parsed.data.minStock;
    if (parsed.data.unitOfMeasure !== undefined) data.unitOfMeasure = parsed.data.unitOfMeasure;
    if (parsed.data.brandId !== undefined) data.brandId = parsed.data.brandId;
    if (parsed.data.presentation !== undefined) data.presentation = parsed.data.presentation;
    if (parsed.data.vehicleCompatibility !== undefined) {
      data.vehicleCompatibility = parsed.data.vehicleCompatibility;
    }
    if (parsed.data.primaryMediaId !== undefined) {
      data.primaryMediaId = parsed.data.primaryMediaId;
    }
    if (parsed.data.purchasePrice !== undefined) {
      data.purchasePrice = String(parsed.data.purchasePrice);
    }
    if (parsed.data.salePrice !== undefined) {
      data.salePrice = String(parsed.data.salePrice);
    }

    const [updated] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, String(req.params.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }

    await logAudit({
      userId: req.user.sub,
      action: "product.update",
      entityType: "product",
      entityId: updated.id,
      payload: parsed.data,
    });

    res.json(updated);
  },
);

router.post(
  "/:id/adjust-stock",
  requireAuth,
  requirePermission("products.edit"),
  async (req, res) => {
    const adjustSchema = z
      .object({
        delta: z.number().int().refine((n) => n !== 0, "Sin cambio de stock"),
        reason: z.enum(["entrada", "merma", "devolucion", "conteo", "otro"]),
        note: z.string().trim().max(500).optional(),
      })
      .superRefine((data, ctx) => {
        if (data.reason === "otro" && !data.note?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La nota es obligatoria cuando el motivo es Otro",
            path: ["note"],
          });
        }
      });
    const parsed = adjustSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, String(req.params.id)))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }

    const newStock = product.stock + parsed.data.delta;
    if (newStock < 0) {
      res.status(409).json({ error: "Stock insuficiente para esta salida" });
      return;
    }

    const [updated] = await db
      .update(products)
      .set({ stock: newStock, updatedAt: new Date() })
      .where(eq(products.id, product.id))
      .returning();

    await logAudit({
      userId: req.user.sub,
      action: "product.stock_adjust",
      entityType: "product",
      entityId: product.id,
      payload: {
        sku: product.sku,
        previousStock: product.stock,
        newStock,
        delta: parsed.data.delta,
        reason: parsed.data.reason,
        note: parsed.data.note,
      },
    });

    res.json(updated);
  },
);

export default router;
