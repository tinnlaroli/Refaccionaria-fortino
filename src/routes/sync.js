import { products, sales, syncCursors } from "@refaccionaria/db";
import { eq, gt } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { createSaleWithItems } from "../lib/create-sale.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/pull", requireAuth, async (req, res) => {
  const since =
    typeof req.query.since === "string" ? new Date(req.query.since) : new Date(0);
  const deviceId =
    typeof req.query.deviceId === "string" ? req.query.deviceId : "default";

  const updatedProducts = await db
    .select()
    .from(products)
    .where(gt(products.updatedAt, since));

  await db
    .insert(syncCursors)
    .values({
      deviceId,
      lastPullAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: syncCursors.deviceId,
      set: { lastPullAt: new Date(), updatedAt: new Date() },
    });

  res.json({
    since: since.toISOString(),
    products: updatedProducts,
    serverTime: new Date().toISOString(),
  });
});

const pushSchema = z.object({
  deviceId: z.string().optional(),
  transactions: z.array(
    z.object({
      clientUuid: z.string().uuid(),
      shiftId: z.string().uuid().optional().nullable(),
      soldAt: z.string().datetime(),
      items: z.array(
        z.object({
          productId: z.string().uuid().optional(),
          sku: z.string(),
          productName: z.string(),
          unitPrice: z.union([z.string(), z.number()]),
          quantity: z.number().int().positive(),
        }),
      ),
    }),
  ),
});

router.post("/push", requireAuth, async (req, res) => {
  const parsed = pushSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const results = [];

  for (const tx of parsed.data.transactions) {
    const existing = await db
      .select({ id: sales.id })
      .from(sales)
      .where(eq(sales.clientUuid, tx.clientUuid))
      .limit(1);

    if (existing.length > 0) {
      results.push({
        clientUuid: tx.clientUuid,
        status: "duplicate",
        saleId: existing[0].id,
      });
      continue;
    }

    try {
      const sale = await createSaleWithItems({
        clientUuid: tx.clientUuid,
        cashierId: req.user.sub,
        shiftId: tx.shiftId,
        soldAt: new Date(tx.soldAt),
        items: tx.items,
      });

      await logAudit({
        userId: req.user.sub,
        action: "sale.sync_push",
        entityType: "sale",
        entityId: sale.id,
        payload: { clientUuid: tx.clientUuid },
      });

      results.push({ clientUuid: tx.clientUuid, status: "ok", saleId: sale.id });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Error";
      await logAudit({
        userId: req.user.sub,
        action: "sale.sync_conflict",
        entityType: "sale",
        entityId: tx.clientUuid,
        payload: { error },
      });
      results.push({ clientUuid: tx.clientUuid, status: "error", error });
    }
  }

  const deviceId = parsed.data.deviceId ?? "default";
  await db
    .insert(syncCursors)
    .values({ deviceId, lastPushAt: new Date(), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: syncCursors.deviceId,
      set: { lastPushAt: new Date(), updatedAt: new Date() },
    });

  res.json({ results });
});

export default router;
