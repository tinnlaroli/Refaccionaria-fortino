import { products, saleItems, sales } from "@refaccionaria/db";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db.js";

export async function cancelSale(params) {
  const database = params.database ?? db;

  return database.transaction(async (tx) => {
    const [sale] = await tx
      .select()
      .from(sales)
      .where(eq(sales.id, params.saleId))
      .limit(1);

    if (!sale) {
      throw new Error("Venta no encontrada");
    }
    if (sale.status === "cancelled") {
      throw new Error("La venta ya fue cancelada");
    }

    const items = await tx
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, sale.id));

    for (const item of items) {
      if (item.productId) {
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }
    }

    const [updated] = await tx
      .update(sales)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: params.cancelledBy,
      })
      .where(eq(sales.id, sale.id))
      .returning();

    return { sale: updated, items };
  });
}
