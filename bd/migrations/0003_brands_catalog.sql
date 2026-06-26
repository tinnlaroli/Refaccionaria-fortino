-- Marcas como catálogo normalizado (FK desde productos)

CREATE TABLE IF NOT EXISTS "brands" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "brands_slug_idx" ON "brands" ("slug");
CREATE INDEX IF NOT EXISTS "brands_name_idx" ON "brands" ("name");

INSERT INTO "brands" ("name", "slug")
SELECT DISTINCT trim("brand"), lower(regexp_replace(trim("brand"), '[^a-zA-Z0-9]+', '-', 'g'))
FROM "products"
WHERE "brand" IS NOT NULL AND trim("brand") <> ''
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand_id" uuid;

UPDATE "products" p
SET "brand_id" = b."id"
FROM "brands" b
WHERE p."brand" IS NOT NULL
  AND trim(p."brand") <> ''
  AND b."slug" = lower(regexp_replace(trim(p."brand"), '[^a-zA-Z0-9]+', '-', 'g'));

ALTER TABLE "products"
  ADD CONSTRAINT "products_brand_id_fkey"
  FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL;

ALTER TABLE "products" DROP COLUMN IF EXISTS "brand";
