import {
  cashShifts,
  categories,
  products,
  purchases,
  sales,
  saleItems,
  users,
} from "@refaccionaria/db";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db.js";
import { requireAnyPermission, requireAuth } from "../middleware/auth.js";

const router = Router();

function hasPerm(user, key) {
  return user?.permissions?.includes(key);
}

function dayBounds(offsetDays = 0) {
  const start = new Date();
  start.setDate(start.getDate() - offsetDays);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function last7DayKeys() {
  const keys = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

router.get(
  "/summary",
  requireAuth,
  requireAnyPermission("products.view", "users.manage", "sales.view_all"),
  async (req, res) => {
    const canViewProducts = hasPerm(req.user, "products.view");
    const canViewSales = hasPerm(req.user, "sales.view_all");
    const canManageUsers = hasPerm(req.user, "users.manage");
    const canViewPurchases = hasPerm(req.user, "purchases.view");

    const { start: startOfDay, end: endOfDay } = dayBounds(0);
    const { start: startOfYesterday, end: endOfYesterday } = dayBounds(1);

    const payload = {
      meta: {
        role: req.user.role,
        canViewProducts,
        canViewSales,
        canManageUsers,
        canViewPurchases,
      },
    };

    if (canViewProducts) {
      const [productStats] = await db
        .select({
          total: count(),
          active: sql`count(*) filter (where ${products.isActive} = true)`,
          lowStock: sql`count(*) filter (where ${products.isActive} = true and ${products.stock} > 0 and ${products.stock} <= ${products.minStock})`,
          outOfStock: sql`count(*) filter (where ${products.isActive} = true and ${products.stock} <= 0)`,
          healthy: sql`count(*) filter (where ${products.isActive} = true and ${products.stock} > ${products.minStock})`,
        })
        .from(products);

      const [categoryCount] = await db
        .select({ total: count() })
        .from(categories);

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

      payload.products = {
        total: Number(productStats?.total ?? 0),
        active: Number(productStats?.active ?? 0),
        lowStock: Number(productStats?.lowStock ?? 0),
        outOfStock: Number(productStats?.outOfStock ?? 0),
        healthy: Number(productStats?.healthy ?? 0),
      };
      payload.categories = Number(categoryCount?.total ?? 0);
      payload.lowStockItems = lowStockItems;

      const [inventoryValue] = await db
        .select({
          atCost: sql`coalesce(sum(${products.stock} * ${products.purchasePrice}), 0)`,
          atSale: sql`coalesce(sum(${products.stock} * ${products.salePrice}), 0)`,
        })
        .from(products)
        .where(eq(products.isActive, true));

      payload.inventoryValue = {
        atCost: Number(inventoryValue?.atCost ?? 0),
        atSale: Number(inventoryValue?.atSale ?? 0),
      };
    }

    if (canManageUsers) {
      const [userStats] = await db
        .select({
          total: count(),
          active: sql`count(*) filter (where ${users.isActive} = true)`,
        })
        .from(users);

      payload.users = {
        total: Number(userStats?.total ?? 0),
        active: Number(userStats?.active ?? 0),
      };
    }

    if (canViewProducts || canViewSales) {
      const [openShifts] = await db
        .select({ total: count() })
        .from(cashShifts)
        .where(eq(cashShifts.status, "open"));

      payload.cash = {
        openShifts: Number(openShifts?.total ?? 0),
      };
    }

    if (canViewSales) {
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

      const [salesYesterday] = await db
        .select({
          count: count(),
          total: sql`coalesce(sum(${sales.total}), 0)`,
        })
        .from(sales)
        .where(
          and(
            gte(sales.soldAt, startOfYesterday),
            lte(sales.soldAt, endOfYesterday),
            eq(sales.status, "completed"),
          ),
        );

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const trendRows = await db
        .select({
          day: sql`date(${sales.soldAt})`,
          count: count(),
          total: sql`coalesce(sum(${sales.total}), 0)`,
        })
        .from(sales)
        .where(
          and(
            gte(sales.soldAt, sevenDaysAgo),
            eq(sales.status, "completed"),
          ),
        )
        .groupBy(sql`date(${sales.soldAt})`)
        .orderBy(sql`date(${sales.soldAt})`);

      const trendMap = new Map(
        trendRows.map((row) => {
          const key = String(row.day).slice(0, 10);
          return [key, { count: Number(row.count), total: Number(row.total) }];
        }),
      );

      payload.salesToday = {
        count: Number(salesToday?.count ?? 0),
        total: Number(salesToday?.total ?? 0),
      };
      payload.salesYesterday = {
        count: Number(salesYesterday?.count ?? 0),
        total: Number(salesYesterday?.total ?? 0),
      };

      const paymentRows = await db
        .select({
          method: sales.paymentMethod,
          count: count(),
          total: sql`coalesce(sum(${sales.total}), 0)`,
        })
        .from(sales)
        .where(
          and(
            gte(sales.soldAt, sevenDaysAgo),
            eq(sales.status, "completed"),
          ),
        )
        .groupBy(sales.paymentMethod);

      payload.paymentBreakdown7Days = paymentRows.map((row) => ({
        method: row.method,
        count: Number(row.count),
        total: Number(row.total),
      }));

      const topProductRows = await db
        .select({
          productName: saleItems.productName,
          quantity: sql`coalesce(sum(${saleItems.quantity}), 0)`,
          revenue: sql`coalesce(sum(${saleItems.quantity} * ${saleItems.unitPrice}), 0)`,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .where(
          and(
            gte(sales.soldAt, sevenDaysAgo),
            eq(sales.status, "completed"),
          ),
        )
        .groupBy(saleItems.productName)
        .orderBy(sql`sum(${saleItems.quantity}) desc`)
        .limit(6);

      payload.topProducts7Days = topProductRows.map((row) => ({
        productName: row.productName,
        quantity: Number(row.quantity),
        revenue: Number(row.revenue),
      }));
      payload.salesTrend7Days = last7DayKeys().map((date) => ({
        date,
        count: trendMap.get(date)?.count ?? 0,
        total: trendMap.get(date)?.total ?? 0,
      }));
      payload.salesWeek = {
        count: payload.salesTrend7Days.reduce((sum, d) => sum + d.count, 0),
        total: payload.salesTrend7Days.reduce((sum, d) => sum + d.total, 0),
      };

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

      payload.recentSales = recentSalesRows.map((s) => ({
        id: s.id,
        total: s.total,
        soldAt: s.soldAt,
        items: (itemsBySaleId.get(s.id) ?? []).map((i) => ({
          productName: i.productName,
          quantity: Number(i.quantity),
        })),
      }));
    }

    if (canViewPurchases) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [purchaseMonth] = await db
        .select({
          count: count(),
          total: sql`coalesce(sum(${purchases.totalCost}), 0)`,
        })
        .from(purchases)
        .where(
          and(
            gte(purchases.purchasedAt, monthStart),
            eq(purchases.status, "completed"),
          ),
        );

      payload.purchasesMonth = {
        count: Number(purchaseMonth?.count ?? 0),
        total: Number(purchaseMonth?.total ?? 0),
      };
    }

    res.json(payload);
  },
);

export default router;
