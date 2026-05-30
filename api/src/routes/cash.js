import { cashMovements, cashShifts, sales, users } from "@refaccionaria/db";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import {
  computeExpectedCash,
  summarizeMovements,
  summarizeShiftSales,
} from "../lib/cash-shift-math.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

async function loadShiftSales(shiftId) {
  return db
    .select({
      total: sales.total,
      paymentMethod: sales.paymentMethod,
      status: sales.status,
    })
    .from(sales)
    .where(eq(sales.shiftId, shiftId));
}

async function buildShiftSummary(shift) {
  const salesRows = await loadShiftSales(shift.id);
  const salesSummary = summarizeShiftSales(salesRows);

  const movements = await db
    .select({
      id: cashMovements.id,
      type: cashMovements.type,
      amount: cashMovements.amount,
      note: cashMovements.note,
      createdAt: cashMovements.createdAt,
      createdByName: users.fullName,
    })
    .from(cashMovements)
    .leftJoin(users, eq(cashMovements.createdBy, users.id))
    .where(eq(cashMovements.shiftId, shift.id))
    .orderBy(desc(cashMovements.createdAt));

  const rawMovements = await db
    .select()
    .from(cashMovements)
    .where(eq(cashMovements.shiftId, shift.id));

  const { movementNet, incomeTotal, expenseTotal } = summarizeMovements(rawMovements);
  const expectedCash = computeExpectedCash(
    shift.openingCash,
    salesSummary.cashSalesTotal,
    movementNet,
  );

  return {
    shift,
    ...salesSummary,
    movementNet,
    incomeTotal,
    expenseTotal,
    expectedCash,
    movements,
  };
}

router.post(
  "/shifts/open",
  requireAuth,
  requirePermission("cash.open_shift"),
  async (req, res) => {
    const schema = z.object({ openingCash: z.string().or(z.number()).default(0) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const open = await db
      .select()
      .from(cashShifts)
      .where(
        and(
          eq(cashShifts.userId, req.user.sub),
          eq(cashShifts.status, "open"),
        ),
      )
      .limit(1);

    if (open.length > 0) {
      res.status(409).json({ error: "Ya tienes un turno abierto", shift: open[0] });
      return;
    }

    const [shift] = await db
      .insert(cashShifts)
      .values({
        userId: req.user.sub,
        openingCash: String(parsed.data.openingCash),
        status: "open",
      })
      .returning();

    res.status(201).json(shift);
  },
);

router.get("/shifts/current", requireAuth, async (req, res) => {
  const [shift] = await db
    .select()
    .from(cashShifts)
    .where(
      and(eq(cashShifts.userId, req.user.sub), eq(cashShifts.status, "open")),
    )
    .limit(1);

  res.json(shift ?? null);
});

router.get(
  "/shifts/:id/summary",
  requireAuth,
  requirePermission("cash.register_movement"),
  async (req, res) => {
    const [shift] = await db
      .select()
      .from(cashShifts)
      .where(eq(cashShifts.id, String(req.params.id)))
      .limit(1);

    if (!shift) {
      res.status(404).json({ error: "Turno no encontrado" });
      return;
    }

    res.json(await buildShiftSummary(shift));
  },
);

router.post(
  "/shifts/:id/close",
  requireAuth,
  requirePermission("cash.close_shift"),
  async (req, res) => {
    const schema = z.object({
      closingCashDeclared: z.string().or(z.number()),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const [shift] = await db
      .select()
      .from(cashShifts)
      .where(eq(cashShifts.id, String(req.params.id)))
      .limit(1);

    if (!shift || shift.status !== "open") {
      res.status(404).json({ error: "Turno no encontrado o ya cerrado" });
      return;
    }

    const summary = await buildShiftSummary(shift);
    const expected = summary.expectedCash;

    const [closed] = await db
      .update(cashShifts)
      .set({
        status: "closed",
        closedAt: new Date(),
        closingCashDeclared: String(parsed.data.closingCashDeclared),
        closingCashExpected: String(expected),
      })
      .where(eq(cashShifts.id, shift.id))
      .returning();

    res.json({
      ...closed,
      ...summary,
      difference: Number(parsed.data.closingCashDeclared) - expected,
    });
  },
);

router.post(
  "/movements",
  requireAuth,
  requirePermission("cash.register_movement"),
  async (req, res) => {
    const schema = z.object({
      shiftId: z.string().uuid(),
      type: z.enum(["income", "expense"]),
      amount: z.string().or(z.number()),
      note: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const [movement] = await db
      .insert(cashMovements)
      .values({
        shiftId: parsed.data.shiftId,
        type: parsed.data.type,
        amount: String(parsed.data.amount),
        note: parsed.data.note,
        createdBy: req.user.sub,
      })
      .returning();

    res.status(201).json(movement);
  },
);

export default router;
