import { apiFetch } from "./client.js";

export type DashboardMeta = {
  role: string;
  canViewProducts: boolean;
  canViewSales: boolean;
  canManageUsers: boolean;
  canViewPurchases: boolean;
};

export type DashboardSummary = {
  meta: DashboardMeta;
  products?: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
    healthy: number;
  };
  categories?: number;
  users?: {
    total: number;
    active: number;
  };
  cash?: {
    openShifts: number;
  };
  inventoryValue?: {
    atCost: number;
    atSale: number;
  };
  salesToday?: {
    count: number;
    total: number;
  };
  salesYesterday?: {
    count: number;
    total: number;
  };
  salesWeek?: {
    count: number;
    total: number;
  };
  salesTrend7Days?: Array<{
    date: string;
    count: number;
    total: number;
  }>;
  paymentBreakdown7Days?: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  topProducts7Days?: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  purchasesMonth?: {
    count: number;
    total: number;
  };
  lowStockItems?: Array<{
    id: string;
    sku: string;
    name: string;
    stock: number;
    minStock: number;
  }>;
  recentSales?: Array<{
    id: string;
    total: string;
    soldAt: string;
    items: Array<{ productName: string; quantity: number }>;
  }>;
};

export function fetchDashboardSummary(token: string) {
  return apiFetch<DashboardSummary>("/api/dashboard/summary", { token });
}
