import { db } from "../db/dexie.js";
import type { CartLine } from "../types/index.js";
import { apiFetch } from "./client.js";

export type PaymentMethod = "cash" | "card" | "transfer";

export async function createSaleOnline(
  token: string,
  params: {
    clientUuid: string;
    shiftId?: string | null;
    soldAt: string;
    paymentMethod?: PaymentMethod;
    amountReceived?: number;
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
      paymentMethod: params.paymentMethod ?? "cash",
      amountReceived: params.amountReceived,
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

async function decrementLocalStock(items: CartLine[]) {
  await db.transaction("rw", db.products, async () => {
    for (const item of items) {
      const product =
        (item.productId
          ? await db.products.get(item.productId)
          : undefined) ?? (await db.products.where("sku").equals(item.sku).first());

      if (!product) continue;

      const nextStock = product.stock - item.quantity;
      if (nextStock < 0) {
        throw new Error(`Stock insuficiente para ${item.sku} en inventario local`);
      }

      await db.products.update(product.id, { stock: nextStock });
    }
  });
}

export async function queueSaleOffline(params: {
  clientUuid: string;
  shiftId?: string | null;
  soldAt: string;
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  items: CartLine[];
}) {
  if (!params.shiftId) {
    throw new Error("Abre un turno de caja antes de registrar ventas offline.");
  }

  const items = params.items.map((i) => ({
    productId: i.productId,
    sku: i.sku,
    productName: i.productName,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
  }));

  await decrementLocalStock(params.items);

  await db.transactionQueue.add({
    clientUuid: params.clientUuid,
    shiftId: params.shiftId,
    soldAt: params.soldAt,
    paymentMethod: params.paymentMethod ?? "cash",
    amountReceived: params.amountReceived,
    items,
    status: "pending",
    createdAt: Date.now(),
  });
}
