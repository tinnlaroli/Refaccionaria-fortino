import { sales } from "@refaccionaria/db";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { createSaleWithItems } from "../lib/create-sale.js";
import { requireAuth, requirePermission, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const saleItemSchema = z.object({
  productId: z.string().uuid().optional(),
  sku: z.string(),
  productName: z.string(),
  unitPrice: z.string().or(z.number()),
  quantity: z.number().int().positive(),
});

const createSaleSchema = z.object({
  clientUuid: z.string().uuid(),
  shiftId: z.string().uuid().optional().nullable(),
  soldAt: z.string().datetime(),
  items: z.array(saleItemSchema).min(1),
});

router.post(
  "/",
  requireAuth,
  requirePermission("sales.create"),
  async (req: AuthRequest, res) => {
    const parsed = createSaleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const existing = await db
      .select({ id: sales.id })
      .from(sales)
      .where(eq(sales.clientUuid, parsed.data.clientUuid))
      .limit(1);

    if (existing.length > 0) {
      res.status(200).json({ id: existing[0].id, duplicate: true });
      return;
    }

    try {
      const result = await createSaleWithItems({
        clientUuid: parsed.data.clientUuid,
        cashierId: req.user!.sub,
        shiftId: parsed.data.shiftId,
        soldAt: new Date(parsed.data.soldAt),
        items: parsed.data.items,
      });

      await logAudit({
        userId: req.user!.sub,
        action: "sale.create",
        entityType: "sale",
        entityId: result.id,
        payload: { clientUuid: parsed.data.clientUuid },
      });

      res.status(201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error en venta";
      await logAudit({
        userId: req.user!.sub,
        action: "sale.conflict",
        entityType: "sale",
        entityId: parsed.data.clientUuid,
        payload: { error: message },
      });
      res.status(409).json({ error: message });
    }
  },
);

router.get("/", requireAuth, requirePermission("sales.view_all"), async (_req, res) => {
  const list = await db.query.sales.findMany({
    with: { items: true },
    orderBy: (s, { desc: d }) => [d(s.soldAt)],
    limit: 100,
  });
  res.json(list);
});

export default router;
