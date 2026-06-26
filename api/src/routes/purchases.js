import { products, purchaseItems, purchases, suppliers, users } from "@refaccionaria/db";
import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import {
  formatZodError,
  moneyZod,
  nonNegativeIntZod,
} from "../lib/field-validators.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

const lineSchema = z.object({
  productId: z.string().uuid(),
  quantity: nonNegativeIntZod("Cantidad").refine((n) => n > 0, "Cantidad mínima 1"),
  unitCost: moneyZod("Costo unitario"),
});

const purchaseSchema = z.object({
  supplierId: z.string().uuid(),
  referenceNumber: z.string().trim().max(80).optional().nullable(),
  purchasedAt: z.string().datetime(),
  notes: z.string().trim().max(500).optional().nullable(),
  items: z.array(lineSchema).min(1, "Agrega al menos una línea"),
});

router.get("/", requireAuth, requirePermission("purchases.view"), async (req, res) => {
  const rows = await db
    .select({
      id: purchases.id,
      supplierId: purchases.supplierId,
      supplierName: suppliers.name,
      referenceNumber: purchases.referenceNumber,
      purchasedAt: purchases.purchasedAt,
      receivedBy: purchases.receivedBy,
      receiverName: users.fullName,
      notes: purchases.notes,
      status: purchases.status,
      totalCost: purchases.totalCost,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .innerJoin(users, eq(purchases.receivedBy, users.id))
    .orderBy(desc(purchases.purchasedAt))
    .limit(100);

  res.json(rows);
});

router.get("/:id", requireAuth, requirePermission("purchases.view"), async (req, res) => {
  const [header] = await db
    .select({
      id: purchases.id,
      supplierId: purchases.supplierId,
      supplierName: suppliers.name,
      referenceNumber: purchases.referenceNumber,
      purchasedAt: purchases.purchasedAt,
      receivedBy: purchases.receivedBy,
      receiverName: users.fullName,
      notes: purchases.notes,
      status: purchases.status,
      totalCost: purchases.totalCost,
      createdAt: purchases.createdAt,
    })
    .from(purchases)
    .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .innerJoin(users, eq(purchases.receivedBy, users.id))
    .where(eq(purchases.id, String(req.params.id)))
    .limit(1);

  if (!header) {
    res.status(404).json({ error: "Compra no encontrada" });
    return;
  }

  const items = await db
    .select()
    .from(purchaseItems)
    .where(eq(purchaseItems.purchaseId, header.id));

  res.json({ ...header, items });
});

router.post("/", requireAuth, requirePermission("purchases.create"), async (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const productMap = new Map();
  for (const id of productIds) {
    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!row) {
      res.status(400).json({ error: `Producto no encontrado: ${id}` });
      return;
    }
    productMap.set(id, row);
  }

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, parsed.data.supplierId))
    .limit(1);
  if (!supplier || !supplier.isActive) {
    res.status(400).json({ error: "Proveedor no válido" });
    return;
  }

  const lines = parsed.data.items.map((line) => {
    const product = productMap.get(line.productId);
    const unitCost = Number(line.unitCost);
    return {
      productId: line.productId,
      sku: product.sku,
      productName: product.name,
      quantity: line.quantity,
      unitCost: String(unitCost),
      lineTotal: String(unitCost * line.quantity),
      newStock: product.stock + line.quantity,
    };
  });

  const totalCost = lines.reduce((sum, l) => sum + Number(l.lineTotal), 0);

  const result = await db.transaction(async (tx) => {
    const [purchase] = await tx
      .insert(purchases)
      .values({
        supplierId: parsed.data.supplierId,
        referenceNumber: parsed.data.referenceNumber || null,
        purchasedAt: new Date(parsed.data.purchasedAt),
        receivedBy: req.user.sub,
        notes: parsed.data.notes || null,
        status: "completed",
        totalCost: String(totalCost),
      })
      .returning();

    await tx.insert(purchaseItems).values(
      lines.map((line) => ({
        purchaseId: purchase.id,
        productId: line.productId,
        sku: line.sku,
        productName: line.productName,
        quantity: line.quantity,
        unitCost: line.unitCost,
        lineTotal: line.lineTotal,
      })),
    );

    for (const line of lines) {
      const product = productMap.get(line.productId);
      await tx
        .update(products)
        .set({
          stock: line.newStock,
          purchasePrice: line.unitCost,
          updatedAt: new Date(),
        })
        .where(eq(products.id, line.productId));

      await logAudit({
        userId: req.user.sub,
        action: "product.stock_adjust",
        entityType: "product",
        entityId: line.productId,
        payload: {
          sku: line.sku,
          previousStock: product.stock,
          newStock: line.newStock,
          delta: line.quantity,
          reason: "compra_proveedor",
          purchaseId: purchase.id,
        },
      });
    }

    await logAudit({
      userId: req.user.sub,
      action: "purchase.create",
      entityType: "purchase",
      entityId: purchase.id,
      payload: {
        supplierId: parsed.data.supplierId,
        referenceNumber: parsed.data.referenceNumber,
        totalCost,
        itemCount: lines.length,
      },
    });

    return purchase;
  });

  res.status(201).json(result);
});

export default router;
