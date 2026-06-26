-- Catálogo extendido, proveedores, compras y biblioteca de imágenes

CREATE TYPE "purchase_status" AS ENUM ('draft', 'completed', 'cancelled');

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unit_of_measure" text DEFAULT 'PZA' NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "presentation" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "vehicle_compatibility" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "primary_media_id" uuid;

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "contact_name" text,
  "email" text,
  "phone" text,
  "address" text,
  "notes" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "suppliers_name_idx" ON "suppliers" ("name");

CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "mime_type" text NOT NULL,
  "url" text NOT NULL,
  "uploaded_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "media_assets_name_idx" ON "media_assets" ("name");

ALTER TABLE "products"
  ADD CONSTRAINT "products_primary_media_id_fkey"
  FOREIGN KEY ("primary_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL;

ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "media_asset_id" uuid;
ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_media_asset_id_fkey"
  FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "supplier_id" uuid NOT NULL REFERENCES "suppliers"("id"),
  "reference_number" text,
  "purchased_at" timestamptz NOT NULL,
  "received_by" uuid NOT NULL REFERENCES "users"("id"),
  "notes" text,
  "status" "purchase_status" DEFAULT 'completed' NOT NULL,
  "total_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "purchases_supplier_idx" ON "purchases" ("supplier_id");
CREATE INDEX IF NOT EXISTS "purchases_purchased_at_idx" ON "purchases" ("purchased_at");

CREATE TABLE IF NOT EXISTS "purchase_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "purchase_id" uuid NOT NULL REFERENCES "purchases"("id") ON DELETE CASCADE,
  "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "sku" text NOT NULL,
  "product_name" text NOT NULL,
  "quantity" integer NOT NULL,
  "unit_cost" numeric(12, 2) NOT NULL,
  "line_total" numeric(12, 2) NOT NULL
);
CREATE INDEX IF NOT EXISTS "purchase_items_purchase_idx" ON "purchase_items" ("purchase_id");
