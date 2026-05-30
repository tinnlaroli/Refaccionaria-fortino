import { products } from "@refaccionaria/db";
import { desc, eq, ilike, or, and, sql } from "drizzle-orm";
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

const productSchema = z.object({
  sku: skuZod(),
  name: nameZod("Nombre del producto"),
  description: descriptionZod(),
  categoryId: z.string().uuid().optional().nullable(),
  purchasePrice: moneyZod("Precio de compra"),
  salePrice: moneyZod("Precio de venta"),
  stock: nonNegativeIntZod("Stock").optional(),
  minStock: nonNegativeIntZod("Stock mínimo").optional(),
  isActive: z.boolean().optional(),
});

router.get("/", requireAuth, requirePermission("products.view"), async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const lowStock = req.query.lowStock === "1" || req.query.lowStock === "true";
  const list = lowStock
    ? await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            sql`${products.stock} <= ${products.minStock}`,
          ),
        )
        .orderBy(products.stock)
        .limit(100)
    : q
    ? await db
        .select()
        .from(products)
        .where(
          or(
            ilike(products.sku, `%${q}%`),
            ilike(products.name, `%${q}%`),
          ),
        )
        .orderBy(desc(products.updatedAt))
        .limit(50)
    : await db.select().from(products).orderBy(desc(products.updatedAt)).limit(100);

  const mapped = list.map((p) => ({
    ...p,
    purchasePrice: req.user?.permissions.includes("products.view_costs")
      ? p.purchasePrice
      : undefined,
  }));

  res.json(mapped);
});

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

  res.json({
    ...product,
    purchasePrice: req.user?.permissions.includes("products.view_costs")
      ? product.purchasePrice
      : undefined,
  });
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
