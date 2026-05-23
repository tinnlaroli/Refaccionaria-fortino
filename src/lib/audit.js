import { auditLogs } from "@refaccionaria/db";
import { db } from "../db.js";

export async function logAudit(params) {
  await db.insert(auditLogs).values({
    userId: params.userId ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    payload: params.payload ?? null,
  });
}
