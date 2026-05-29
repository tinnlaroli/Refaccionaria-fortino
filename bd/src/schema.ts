import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const shiftStatusEnum = pgEnum("shift_status", [
  "open",
  "closed",
]);

export const cashMovementTypeEnum = pgEnum("cash_movement_type", [
  "income",
  "expense",
]);

export const saleSyncStatusEnum = pgEnum("sale_sync_status", [
  "synced",
  "pending",
  "conflict",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "transfer",
]);

export const saleStatusEnum = pgEnum("sale_status", [
  "completed",
  "cancelled",
]);

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    description: text("description"),
  },
  (table) => [uniqueIndex("permissions_key_idx").on(table.key)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("role_permissions_pk").on(table.roleId, table.permissionId),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    salePrice: numeric("sale_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    stock: integer("stock").notNull().default(0),
    minStock: integer("min_stock").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("products_sku_idx").on(table.sku),
    index("products_category_idx").on(table.categoryId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("product_images_product_idx").on(table.productId)],
);

export const cashShifts = pgTable(
  "cash_shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    openingCash: numeric("opening_cash", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    closingCashDeclared: numeric("closing_cash_declared", {
      precision: 12,
      scale: 2,
    }),
    closingCashExpected: numeric("closing_cash_expected", {
      precision: 12,
      scale: 2,
    }),
    status: shiftStatusEnum("status").notNull().default("open"),
  },
  (table) => [
    index("cash_shifts_user_idx").on(table.userId),
    index("cash_shifts_status_idx").on(table.status),
  ],
);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientUuid: uuid("client_uuid").notNull().unique(),
    cashierId: uuid("cashier_id")
      .notNull()
      .references(() => users.id),
    shiftId: uuid("shift_id").references(() => cashShifts.id, {
      onDelete: "set null",
    }),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
    amountReceived: numeric("amount_received", { precision: 12, scale: 2 }),
    status: saleStatusEnum("status").notNull().default("completed"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: uuid("cancelled_by").references(() => users.id, {
      onDelete: "set null",
    }),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull(),
    syncStatus: saleSyncStatusEnum("sync_status").notNull().default("synced"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sales_client_uuid_idx").on(table.clientUuid),
    index("sales_sold_at_idx").on(table.soldAt),
    index("sales_cashier_idx").on(table.cashierId),
    index("sales_status_idx").on(table.status),
  ],
);

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    sku: text("sku").notNull(),
    productName: text("product_name").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [index("sale_items_sale_idx").on(table.saleId)],
);

export const cashMovements = pgTable(
  "cash_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => cashShifts.id, { onDelete: "cascade" }),
    type: cashMovementTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    note: text("note"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("cash_movements_shift_idx").on(table.shiftId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("audit_logs_created_at_idx").on(table.createdAt)],
);

export const syncCursors = pgTable(
  "sync_cursors",
  {
    deviceId: text("device_id").primaryKey(),
    lastPullAt: timestamp("last_pull_at", { withTimezone: true }),
    lastPushAt: timestamp("last_push_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  sales: many(sales),
  cashShifts: many(cashShifts),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  saleItems: many(saleItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  cashier: one(users, { fields: [sales.cashierId], references: [users.id] }),
  shift: one(cashShifts, {
    fields: [sales.shiftId],
    references: [cashShifts.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));
