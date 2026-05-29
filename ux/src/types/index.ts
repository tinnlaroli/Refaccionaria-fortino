export type UserSession = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  salePrice: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  updatedAt: string;
};

export type CartLine = {
  productId: string;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  maxStock?: number;
};

export type CashShift = {
  id: string;
  userId: string;
  openedAt: string;
  openingCash: string;
  status: "open" | "closed";
  closingCashDeclared?: string | null;
  closingCashExpected?: string | null;
};

export type QueuedSaleItem = {
  productId?: string;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type SyncState = "idle" | "syncing" | "error";

export type ConnectionState = "online" | "offline" | "syncing";
