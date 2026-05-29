import { apiFetch } from "./client.js";

export type DashboardSummary = {
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  categories: number;
  users: {
    total: number;
    active: number;
  };
  cash: {
    openShifts: number;
  };
  salesToday: {
    count: number;
    total: number;
  };
  lowStockItems: Array<{
    id: string;
    sku: string;
    name: string;
    stock: number;
    minStock: number;
  }>;
  recentSales: Array<{
    id: string;
    total: string;
    soldAt: string;
    items: Array<{ productName: string; quantity: number }>;
  }>;
};

export function fetchDashboardSummary(token: string) {
  return apiFetch<DashboardSummary>("/api/dashboard/summary", { token });
}
