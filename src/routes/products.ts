import { products } from "@refaccionaria/db";
import { desc, eq, ilike, or } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { requireAuth, requirePermission, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  purchasePrice: z.string().or(z.number()),
  salePrice: z.string().or(z.number()),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const list = q
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

router.get("/sku/:sku", requireAuth, async (req: AuthRequest, res) => {
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
  async (req: AuthRequest, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
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
      userId: req.user!.sub,
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
  async (req: AuthRequest, res) => {
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const data: Record<string, unknown> = { updatedAt: new Date() };
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
      userId: req.user!.sub,
      action: "product.update",
      entityType: "product",
      entityId: updated.id,
      payload: parsed.data,
    });

    res.json(updated);
  },
);

export default router;
