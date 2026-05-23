import { db } from "../db/dexie.js";
import type { CartLine } from "../types/index.js";
import { apiFetch } from "./client.js";

export async function createSaleOnline(
  token: string,
  params: {
    clientUuid: string;
    shiftId?: string | null;
    soldAt: string;
    items: CartLine[];
  },
) {
  return apiFetch<{ id: string }>("/api/sales", {
    method: "POST",
    token,
    body: JSON.stringify({
      clientUuid: params.clientUuid,
      shiftId: params.shiftId,
      soldAt: params.soldAt,
      items: params.items.map((i) => ({
        productId: i.productId,
        sku: i.sku,
        productName: i.productName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
    }),
  });
}

export async function queueSaleOffline(params: {
  clientUuid: string;
  shiftId?: string | null;
  soldAt: string;
  items: CartLine[];
}) {
  await db.transactionQueue.add({
    clientUuid: params.clientUuid,
    shiftId: params.shiftId,
    soldAt: params.soldAt,
    items: params.items.map((i) => ({
      productId: i.productId,
      sku: i.sku,
      productName: i.productName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
    status: "pending",
    createdAt: Date.now(),
  });
}
