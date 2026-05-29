import { saleItems, sales, users } from "@refaccionaria/db";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../db.js";

export async function loadSalesWithDetails(ids) {
  if (ids.length === 0) return [];

  const saleRows = await db
    .select({
      id: sales.id,
      clientUuid: sales.clientUuid,
      total: sales.total,
      soldAt: sales.soldAt,
      paymentMethod: sales.paymentMethod,
      amountReceived: sales.amountReceived,
      status: sales.status,
      cancelledAt: sales.cancelledAt,
      cashierId: sales.cashierId,
      cashierName: users.fullName,
      cashierEmail: users.email,
    })
    .from(sales)
    .leftJoin(users, eq(sales.cashierId, users.id))
    .where(inArray(sales.id, ids))
    .orderBy(desc(sales.soldAt));

  const items = await db
    .select()
    .from(saleItems)
    .where(inArray(saleItems.saleId, ids));

  const itemsBySale = new Map();
  for (const item of items) {
    const list = itemsBySale.get(item.saleId) ?? [];
    list.push(item);
    itemsBySale.set(item.saleId, list);
  }

  return saleRows.map((s) => ({
    id: s.id,
    clientUuid: s.clientUuid,
    total: s.total,
    soldAt: s.soldAt,
    paymentMethod: s.paymentMethod ?? "cash",
    amountReceived: s.amountReceived,
    status: s.status ?? "completed",
    cancelledAt: s.cancelledAt,
    cashier: s.cashierName
      ? { fullName: s.cashierName, email: s.cashierEmail ?? "" }
      : undefined,
    items: itemsBySale.get(s.id) ?? [],
  }));
}
