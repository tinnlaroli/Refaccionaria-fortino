import { cashMovements, cashShifts, saleItems, sales, users } from "@refaccionaria/db";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { cancelSale } from "../lib/cancel-sale.js";
import { createSaleWithItems } from "../lib/create-sale.js";
import { loadSalesWithDetails } from "../lib/load-sales.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

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
  paymentMethod: z.enum(["cash", "card", "transfer"]).default("cash"),
  amountReceived: z.string().or(z.number()).optional(),
  items: z.array(saleItemSchema).min(1),
});

router.post(
  "/",
  requireAuth,
  requirePermission("sales.create"),
  async (req, res) => {
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

    if (parsed.data.paymentMethod === "cash" && parsed.data.amountReceived != null) {
      const totalEstimate = parsed.data.items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      );
      if (Number(parsed.data.amountReceived) < totalEstimate) {
        res.status(400).json({ error: "Monto recibido insuficiente" });
        return;
      }
    }

    const [openShift] = await db
      .select({ id: cashShifts.id })
      .from(cashShifts)
      .where(
        and(
          eq(cashShifts.userId, req.user.sub),
          eq(cashShifts.status, "open"),
        ),
      )
      .limit(1);

    if (!openShift) {
      res.status(422).json({
        code: "NO_OPEN_SHIFT",
        error: "Debes abrir un turno de caja antes de registrar ventas.",
      });
      return;
    }

    const shiftId = parsed.data.shiftId ?? openShift.id;
    if (shiftId !== openShift.id) {
      res.status(400).json({ error: "El turno indicado no coincide con tu turno abierto." });
      return;
    }

    try {
      const result = await createSaleWithItems({
        clientUuid: parsed.data.clientUuid,
        cashierId: req.user.sub,
        shiftId,
        soldAt: new Date(parsed.data.soldAt),
        paymentMethod: parsed.data.paymentMethod,
        amountReceived: parsed.data.amountReceived,
        items: parsed.data.items,
      });

      await logAudit({
        userId: req.user.sub,
        action: "sale.create",
        entityType: "sale",
        entityId: result.id,
        payload: {
          clientUuid: parsed.data.clientUuid,
          paymentMethod: parsed.data.paymentMethod,
        },
      });

      res.status(201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error en venta";
      await logAudit({
        userId: req.user.sub,
        action: "sale.conflict",
        entityType: "sale",
        entityId: parsed.data.clientUuid,
        payload: { error: message },
      });
      res.status(409).json({ error: message });
    }
  },
);

router.get("/", requireAuth, requirePermission("sales.view_all"), async (req, res) => {
  const from =
    typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
  const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const conditions = [];
  if (from && !Number.isNaN(from.getTime())) {
    conditions.push(gte(sales.soldAt, from));
  }
  if (to && !Number.isNaN(to.getTime())) {
    conditions.push(lte(sales.soldAt, to));
  }
  if (status === "completed" || status === "cancelled") {
    conditions.push(eq(sales.status, status));
  }
  if (q) {
    conditions.push(
      or(
        ilike(saleItems.sku, `%${q}%`),
        ilike(saleItems.productName, `%${q}%`),
      ),
    );
  }

  const saleRows = q
    ? await db
        .selectDistinct({ id: sales.id, soldAt: sales.soldAt })
        .from(sales)
        .innerJoin(saleItems, eq(saleItems.saleId, sales.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(sales.soldAt))
        .limit(limit)
    : await db
        .select({ id: sales.id })
        .from(sales)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(sales.soldAt))
        .limit(limit);

  const ids = saleRows.map((r) => r.id);
  if (ids.length === 0) {
    res.json([]);
    return;
  }

  const list = await loadSalesWithDetails(ids);

  res.json(list);
});

router.get(
  "/export",
  requireAuth,
  requirePermission("reports.export"),
  async (req, res) => {
    const from =
      typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;

    const conditions = [];
    if (from && !Number.isNaN(from.getTime())) {
      conditions.push(gte(sales.soldAt, from));
    }
    if (to && !Number.isNaN(to.getTime())) {
      conditions.push(lte(sales.soldAt, to));
    }

    const saleRows = await db
      .select({ id: sales.id })
      .from(sales)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sales.soldAt))
      .limit(5000);

    const list = await loadSalesWithDetails(saleRows.map((r) => r.id));

    const header =
      "fecha,total,estado,pago,cajero,sku,producto,cantidad,precio_unitario,linea\n";
    const rows = list.flatMap((sale) =>
      sale.items.map((item) => {
        const cols = [
          new Date(sale.soldAt).toISOString(),
          sale.total,
          sale.status,
          sale.paymentMethod,
          sale.cashier?.fullName ?? "",
          item.sku,
          `"${item.productName.replace(/"/g, '""')}"`,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
        ];
        return cols.join(",");
      }),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ventas-fortino.csv"',
    );
    res.send("\uFEFF" + header + rows.join("\n"));
  },
);

router.post(
  "/:id/cancel",
  requireAuth,
  requirePermission("sales.cancel"),
  async (req, res) => {
    try {
      const result = await cancelSale({
        saleId: String(req.params.id),
        cancelledBy: req.user.sub,
      });

      await logAudit({
        userId: req.user.sub,
        action: "sale.cancel",
        entityType: "sale",
        entityId: result.sale.id,
        payload: { total: result.sale.total },
      });

      res.json(result.sale);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cancelar";
      res.status(409).json({ error: message });
    }
  },
);

export default router;
