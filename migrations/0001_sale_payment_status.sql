CREATE TYPE "payment_method" AS ENUM('cash', 'card', 'transfer');
CREATE TYPE "sale_status" AS ENUM('completed', 'cancelled');

ALTER TABLE "sales" ADD COLUMN "payment_method" "payment_method" DEFAULT 'cash' NOT NULL;
ALTER TABLE "sales" ADD COLUMN "amount_received" numeric(12, 2);
ALTER TABLE "sales" ADD COLUMN "status" "sale_status" DEFAULT 'completed' NOT NULL;
ALTER TABLE "sales" ADD COLUMN "cancelled_at" timestamptz;
ALTER TABLE "sales" ADD COLUMN "cancelled_by" uuid REFERENCES "users"("id") ON DELETE SET NULL;

CREATE INDEX "sales_status_idx" ON "sales" ("status");
