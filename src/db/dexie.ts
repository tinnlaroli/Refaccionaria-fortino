import Dexie, { type Table } from "dexie";
import type { Product, QueuedSaleItem, UserSession } from "../types/index.js";

export type AuthCacheRow = {
  id: "session";
  accessToken: string;
  refreshToken: string;
  user: UserSession;
  expiresAt: number;
};

export type ProductRow = Product;

export type TransactionQueueRow = {
  id?: number;
  clientUuid: string;
  shiftId?: string | null;
  soldAt: string;
  items: QueuedSaleItem[];
  status: "pending" | "synced" | "error";
  error?: string;
  createdAt: number;
};

export type SyncMetaRow = {
  id: "meta";
  lastPullAt: string;
  deviceId: string;
};

export type ShiftCacheRow = {
  id: "current";
  shiftId: string;
  openingCash: string;
};

class PosDatabase extends Dexie {
  authCache!: Table<AuthCacheRow, string>;
  products!: Table<ProductRow, string>;
  transactionQueue!: Table<TransactionQueueRow, number>;
  syncMeta!: Table<SyncMetaRow, string>;
  shiftCache!: Table<ShiftCacheRow, string>;

  constructor() {
    super("refaccionaria-pos");
    this.version(1).stores({
      authCache: "id",
      products: "id, sku, updatedAt",
      transactionQueue: "++id, clientUuid, status, createdAt",
      syncMeta: "id",
      shiftCache: "id",
    });
  }
}

export const db = new PosDatabase();
