import { apiFetch } from "./client.js";

export type SaleRecord = {
  id: string;
  total: string;
  soldAt: string;
  clientUuid: string;
  paymentMethod: "cash" | "card" | "transfer";
  amountReceived: string | null;
  status: "completed" | "cancelled";
  cancelledAt: string | null;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  cashier?: { fullName: string; email: string };
};

export type SaleQuery = {
  from?: string;
  to?: string;
  q?: string;
  status?: "completed" | "cancelled";
  limit?: number;
};

export function fetchSales(token: string, query?: SaleQuery) {
  const params = new URLSearchParams();
  if (query?.from) params.set("from", query.from);
  if (query?.to) params.set("to", query.to);
  if (query?.q) params.set("q", query.q);
  if (query?.status) params.set("status", query.status);
  if (query?.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return apiFetch<SaleRecord[]>(`/api/sales${qs ? `?${qs}` : ""}`, { token });
}

export function cancelSale(token: string, id: string) {
  return apiFetch<SaleRecord>(`/api/sales/${id}/cancel`, {
    method: "POST",
    token,
  });
}

export async function exportSalesCsv(token: string, query?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (query?.from) params.set("from", query.from);
  if (query?.to) params.set("to", query.to);
  const qs = params.toString();
  const res = await fetch(`/api/sales/export${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "No se pudo exportar");
  }
  return res.blob();
}
