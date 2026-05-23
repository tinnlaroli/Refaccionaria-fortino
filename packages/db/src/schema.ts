import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/** Placeholder — Fase 1 expandirá el esquema completo en feat/bd */
export const healthChecks = pgTable("health_checks", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
