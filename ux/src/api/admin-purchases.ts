import { apiFetch } from "./client.js";

export type PurchaseLineInput = {
  productId: string;
  quantity: number;
  unitCost: number | string;
};

export type PurchaseInput = {
  supplierId: string;
  referenceNumber?: string | null;
  purchasedAt: string;
  notes?: string | null;
  items: PurchaseLineInput[];
};

export type PurchaseSummary = {
  id: string;
  supplierId: string;
  supplierName: string;
  referenceNumber?: string | null;
  purchasedAt: string;
  receivedBy: string;
  receiverName: string;
  notes?: string | null;
  status: "draft" | "completed" | "cancelled";
  totalCost: string;
  createdAt: string;
};

export type PurchaseDetail = PurchaseSummary & {
  items: Array<{
    id: string;
    purchaseId: string;
    productId?: string | null;
    sku: string;
    productName: string;
    quantity: number;
    unitCost: string;
    lineTotal: string;
  }>;
};

export function fetchPurchases(token: string) {
  return apiFetch<PurchaseSummary[]>("/api/purchases", { token });
}

export function fetchPurchase(token: string, id: string) {
  return apiFetch<PurchaseDetail>(`/api/purchases/${id}`, { token });
}

export function createPurchase(token: string, data: PurchaseInput) {
  return apiFetch<PurchaseSummary>("/api/purchases", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}
