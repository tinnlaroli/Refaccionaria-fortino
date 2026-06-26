-- Marcas como catálogo normalizado (FK desde productos)
-- En base limpia la tabla y FK ya existen desde 0000; este migration
-- solo se ejecuta si por algún motivo faltan.

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
