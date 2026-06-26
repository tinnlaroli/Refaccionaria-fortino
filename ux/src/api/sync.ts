import { db } from "../db/dexie.js";
import type { Product } from "../types/index.js";
import { apiFetch } from "./client.js";

const DEVICE_ID = "pos-terminal-1";

type PullResponse = {
  since: string;
  products: Product[];
  serverTime: string;
};

type PushResponse = {
  results: Array<{
    clientUuid: string;
    status: "ok" | "duplicate" | "error";
    saleId?: string;
    error?: string;
  }>;
};

async function getMeta() {
  const meta = await db.syncMeta.get("meta");
  return meta ?? { id: "meta" as const, lastPullAt: new Date(0).toISOString(), deviceId: DEVICE_ID };
}

export async function pullCatalog(token: string) {
  const meta = await getMeta();
  const data = await apiFetch<PullResponse>(
    `/api/sync/pull?since=${encodeURIComponent(meta.lastPullAt)}&deviceId=${DEVICE_ID}`,
    { token },
  );

  if (data.products.length > 0) {
    await db.products.bulkPut(
      data.products.map((p) => ({
        ...p,
        updatedAt:
          typeof p.updatedAt === "string"
            ? p.updatedAt
            : new Date().toISOString(),
      })),
    );
  }

  await db.syncMeta.put({
    id: "meta",
    lastPullAt: data.serverTime,
    deviceId: DEVICE_ID,
  });

  return data.products.length;
}

export async function pushPendingSales(token: string) {
  await db.transactionQueue
    .where("status")
    .equals("error")
    .modify({ status: "pending", error: undefined });

  const pending = await db.transactionQueue
    .where("status")
    .equals("pending")
    .sortBy("createdAt");

  if (pending.length === 0) return { pushed: 0, errors: 0 };

  const data = await apiFetch<PushResponse>("/api/sync/push", {
    method: "POST",
    token,
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      transactions: pending.map((tx) => ({
        clientUuid: tx.clientUuid,
        shiftId: tx.shiftId,
        soldAt: tx.soldAt,
        paymentMethod: tx.paymentMethod,
        amountReceived: tx.amountReceived,
        items: tx.items.map((i) => ({
          productId: i.productId,
          sku: i.sku,
          productName: i.productName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      })),
    }),
  });

  let errors = 0;
  for (const result of data.results) {
    const row = pending.find((p) => p.clientUuid === result.clientUuid);
    if (!row?.id) continue;

    if (result.status === "ok" || result.status === "duplicate") {
      await db.transactionQueue.update(row.id, { status: "synced" });
    } else {
      errors++;
      await db.transactionQueue.update(row.id, {
        status: "error",
        error: result.error,
      });
    }
  }

  return { pushed: pending.length - errors, errors };
}

export async function fullSync(token: string) {
  await pushPendingSales(token);
  const pulled = await pullCatalog(token);
  return { pulled };
}

export async function getPendingCount() {
  return db.transactionQueue.where("status").equals("pending").count();
}

export async function getFailedSyncCount() {
  return db.transactionQueue.where("status").equals("error").count();
}

export async function getSyncQueueStats() {
  const [pending, failed] = await Promise.all([getPendingCount(), getFailedSyncCount()]);
  return { pending, failed };
}

export async function getActiveQueueItems() {
  return db.transactionQueue
    .where("status")
    .anyOf(["pending", "error"])
    .sortBy("createdAt");
}

export async function discardQueueItem(id: number) {
  await db.transactionQueue.delete(id);
}

export async function retryAllFailed(token: string) {
  await db.transactionQueue.where("status").equals("error").modify({ status: "pending", error: undefined });
  return pushPendingSales(token);
}

export async function purgeSyncedQueue(olderThanDays = 7) {
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const synced = await db.transactionQueue.where("status").equals("synced").toArray();
  const stale = synced.filter((r) => r.createdAt < cutoff);
  await db.transactionQueue.bulkDelete(stale.map((r) => r.id!));
  return stale.length;
}
