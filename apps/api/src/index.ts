import cors from "cors";
import express from "express";
import postgres from "postgres";

const app = express();
const port = Number(process.env.PORT ?? 3000);

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://refaccionaria:refaccionaria_dev@postgres:5432/refaccionaria";

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "refaccionaria-api" });
});

app.get("/api/status", async (_req, res) => {
  try {
    const sql = postgres(connectionString, { max: 1 });
    const result = await sql`SELECT NOW() AS server_time`;
    await sql.end();
    res.json({
      status: "ok",
      database: "connected",
      serverTime: result[0]?.server_time,
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/info", (_req, res) => {
  res.json({
    name: "Refaccionaria Fortino API",
    version: "0.0.0",
    branch: "feat/api",
    phase: "scaffold",
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${port}`);
});
