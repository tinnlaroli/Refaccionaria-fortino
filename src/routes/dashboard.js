import {
  cashShifts,
  categories,
  products,
  sales,
  saleItems,
  users,
} from "@refaccionaria/db";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db.js";
import { requireAnyPermission, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/summary",
  requireAuth,
  requireAnyPermission("products.view", "users.manage", "sales.view_all"),
  async (_req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [productStats] = await db
      .select({
        total: count(),
        active: sql`count(*) filter (where ${products.isActive} = true)`,
        lowStock: sql`count(*) filter (where ${products.isActive} = true and ${products.stock} > 0 and ${products.stock} <= ${products.minStock})`,
        outOfStock: sql`count(*) filter (where ${products.isActive} = true and ${products.stock} <= 0)`,
      })
      .from(products);

    const [categoryCount] = await db
      .select({ total: count() })
      .from(categories);

    const [userStats] = await db
      .select({
        total: count(),
        active: sql`count(*) filter (where ${users.isActive} = true)`,
      })
      .from(users);

    const [openShifts] = await db
      .select({ total: count() })
      .from(cashShifts)
      .where(eq(cashShifts.status, "open"));

    const [salesToday] = await db
      .select({
        count: count(),
        total: sql`coalesce(sum(${sales.total}), 0)`,
      })
      .from(sales)
      .where(
        and(
          gte(sales.soldAt, startOfDay),
          lte(sales.soldAt, endOfDay),
          eq(sales.status, "completed"),
        ),
      );

    const lowStockItems = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        stock: products.stock,
        minStock: products.minStock,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stock} <= ${products.minStock}`,
        ),
      )
      .orderBy(products.stock)
      .limit(8);

    // Evitar depender de relaciones inferidas por Drizzle para el dashboard.
    // Hacemos 2 queries: últimas ventas y luego sus ítems.
    const recentSalesRows = await db
      .select({
        id: sales.id,
        soldAt: sales.soldAt,
        total: sales.total,
      })
      .from(sales)
      .orderBy(desc(sales.soldAt))
      .limit(5);

    const recentSaleIds = recentSalesRows.map((s) => s.id);

    const recentItems = recentSaleIds.length
      ? await db
          .select({
            saleId: saleItems.saleId,
            productName: saleItems.productName,
            quantity: saleItems.quantity,
          })
          .from(saleItems)
          .where(inArray(saleItems.saleId, recentSaleIds))
      : [];

    const itemsBySaleId = new Map();
    for (const item of recentItems) {
      const list = itemsBySaleId.get(item.saleId) ?? [];
      list.push(item);
      itemsBySaleId.set(item.saleId, list);
    }

    const recentSales = recentSalesRows.map((s) => ({
      id: s.id,
      total: s.total,
      soldAt: s.soldAt,
      items: (itemsBySaleId.get(s.id) ?? []).map((i) => ({
        productName: i.productName,
        quantity: Number(i.quantity),
      })),
    }));

    res.json({
      products: {
        total: Number(productStats?.total ?? 0),
        active: Number(productStats?.active ?? 0),
        lowStock: Number(productStats?.lowStock ?? 0),
        outOfStock: Number(productStats?.outOfStock ?? 0),
      },
      categories: Number(categoryCount?.total ?? 0),
      users: {
        total: Number(userStats?.total ?? 0),
        active: Number(userStats?.active ?? 0),
      },
      cash: {
        openShifts: Number(openShifts?.total ?? 0),
      },
      salesToday: {
        count: Number(salesToday?.count ?? 0),
        total: Number(salesToday?.total ?? 0),
      },
      lowStockItems,
      recentSales,
    });
  },
);

export default router;
