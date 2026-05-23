import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://refaccionaria:refaccionaria_dev@localhost:5432/refaccionaria";

async function runMigrations() {
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("[db] Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("[db] Migrations complete.");

  await sql.end();
}

runMigrations().catch((error) => {
  console.error("[db] Migration failed:", error);
  process.exit(1);
});
