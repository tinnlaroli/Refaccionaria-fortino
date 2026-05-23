CREATE TYPE "shift_status" AS ENUM('open', 'closed');
CREATE TYPE "cash_movement_type" AS ENUM('income', 'expense');
CREATE TYPE "sale_sync_status" AS ENUM('synced', 'pending', 'conflict');

CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL UNIQUE,
  "description" text
);

CREATE TABLE "role_permissions" (
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "role_permissions_pk" ON "role_permissions" ("role_id", "permission_id");

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "full_name" text NOT NULL,
  "role_id" uuid NOT NULL REFERENCES "roles"("id"),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" ("slug");

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sku" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
  "purchase_price" numeric(12, 2) DEFAULT '0' NOT NULL,
  "sale_price" numeric(12, 2) DEFAULT '0' NOT NULL,
  "stock" integer DEFAULT 0 NOT NULL,
  "min_stock" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "products_sku_idx" ON "products" ("sku");
CREATE INDEX "products_category_idx" ON "products" ("category_id");

CREATE TABLE "product_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
CREATE INDEX "product_images_product_idx" ON "product_images" ("product_id");

CREATE TABLE "cash_shifts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "opened_at" timestamptz DEFAULT now() NOT NULL,
  "closed_at" timestamptz,
  "opening_cash" numeric(12, 2) DEFAULT '0' NOT NULL,
  "closing_cash_declared" numeric(12, 2),
  "closing_cash_expected" numeric(12, 2),
  "status" "shift_status" DEFAULT 'open' NOT NULL
);
CREATE INDEX "cash_shifts_user_idx" ON "cash_shifts" ("user_id");
CREATE INDEX "cash_shifts_status_idx" ON "cash_shifts" ("status");

CREATE TABLE "sales" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_uuid" uuid NOT NULL UNIQUE,
  "cashier_id" uuid NOT NULL REFERENCES "users"("id"),
  "shift_id" uuid REFERENCES "cash_shifts"("id") ON DELETE SET NULL,
  "total" numeric(12, 2) NOT NULL,
  "sold_at" timestamptz NOT NULL,
  "sync_status" "sale_sync_status" DEFAULT 'synced' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "sales_client_uuid_idx" ON "sales" ("client_uuid");
CREATE INDEX "sales_sold_at_idx" ON "sales" ("sold_at");
CREATE INDEX "sales_cashier_idx" ON "sales" ("cashier_id");

CREATE TABLE "sale_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sale_id" uuid NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
  "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "sku" text NOT NULL,
  "product_name" text NOT NULL,
  "unit_price" numeric(12, 2) NOT NULL,
  "quantity" integer NOT NULL,
  "line_total" numeric(12, 2) NOT NULL
);
CREATE INDEX "sale_items_sale_idx" ON "sale_items" ("sale_id");

CREATE TABLE "cash_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "shift_id" uuid NOT NULL REFERENCES "cash_shifts"("id") ON DELETE CASCADE,
  "type" "cash_movement_type" NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "note" text,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "cash_movements_shift_idx" ON "cash_movements" ("shift_id");

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "payload" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" ("created_at");

CREATE TABLE "sync_cursors" (
  "device_id" text PRIMARY KEY NOT NULL,
  "last_pull_at" timestamptz,
  "last_push_at" timestamptz,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
