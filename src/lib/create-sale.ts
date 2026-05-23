import { products, saleItems, sales } from "@refaccionaria/db";
import { and, eq, gte, sql } from "drizzle-orm";
import type { createDb } from "@refaccionaria/db";
import { db } from "../db.js";

type DbInstance = ReturnType<typeof createDb>["db"];

export type SaleItemInput = {
  productId?: string;
  sku: string;
  productName: string;
  unitPrice: string | number;
  quantity: number;
};

export async function createSaleWithItems(params: {
  clientUuid: string;
  cashierId: string;
  shiftId?: string | null;
  soldAt: Date;
  items: SaleItemInput[];
  database?: DbInstance;
}) {
  const database = params.database ?? db;

  const lineItems = params.items.map((item) => {
    const unitPrice = Number(item.unitPrice);
    const lineTotal = unitPrice * item.quantity;
    return {
      ...item,
      unitPrice: String(unitPrice),
      lineTotal: String(lineTotal),
    };
  });

  const total = lineItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);

  return database.transaction(async (tx) => {
    const [sale] = await tx
      .insert(sales)
      .values({
        clientUuid: params.clientUuid,
        cashierId: params.cashierId,
        shiftId: params.shiftId ?? null,
        total: String(total),
        soldAt: params.soldAt,
        syncStatus: "synced",
      })
      .returning();

    for (const item of lineItems) {
      await tx.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId ?? null,
        sku: item.sku,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      });

      if (item.productId) {
        const updated = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, item.productId),
              gte(products.stock, item.quantity),
            ),
          )
          .returning({ id: products.id });

        if (updated.length === 0) {
          throw new Error(`Stock insuficiente para ${item.sku}`);
        }
      }
    }

    return sale;
  });
}
