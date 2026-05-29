import { auditLogs, users } from "@refaccionaria/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requirePermission("products.view"), async (req, res) => {
  const action =
    typeof req.query.action === "string" ? req.query.action : undefined;
  const entityType =
    typeof req.query.entityType === "string" ? req.query.entityType : undefined;
  const from =
    typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
  const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const conditions = [];
  if (action) conditions.push(eq(auditLogs.action, action));
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (from && !Number.isNaN(from.getTime())) {
    conditions.push(gte(auditLogs.createdAt, from));
  }
  if (to && !Number.isNaN(to.getTime())) {
    conditions.push(lte(auditLogs.createdAt, to));
  }

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      payload: auditLogs.payload,
      createdAt: auditLogs.createdAt,
      userName: users.fullName,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  res.json(rows);
});

export default router;
