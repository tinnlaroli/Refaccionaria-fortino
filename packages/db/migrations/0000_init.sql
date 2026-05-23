CREATE TABLE IF NOT EXISTS "health_checks" (
  "id" serial PRIMARY KEY NOT NULL,
  "label" text NOT NULL,
  "checked_at" timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO "health_checks" ("label") VALUES ('refaccionaria-fortino-init')
ON CONFLICT DO NOTHING;
