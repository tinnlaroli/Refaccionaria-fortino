import cors from "cors";
import express from "express";
import { sql } from "drizzle-orm";
import { config } from "./config.js";
import { db } from "./db.js";
import authRoutes from "./routes/auth.js";
import cashRoutes from "./routes/cash.js";
import categoriesRoutes from "./routes/categories.js";
import productsRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";
import syncRoutes from "./routes/sync.js";
import publicRoutes from "./routes/public.js";
import usersRoutes from "./routes/users.js";
import dashboardRoutes from "./routes/dashboard.js";
import rolesRoutes from "./routes/roles.js";
import auditRoutes from "./routes/audit.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "refaccionaria-api", version: "0.1.0" });
});

app.get("/api/status", async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT NOW() AS server_time`);
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
    version: "0.1.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      categories: "/api/categories",
      sales: "/api/sales",
      cash: "/api/cash",
      sync: "/api/sync",
      users: "/api/users",
      public: "/api/public",
      dashboard: "/api/dashboard",
      roles: "/api/roles",
      audit: "/api/audit",
    },
  });
});

app.use("/api/public", publicRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/audit", auditRoutes);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${config.port}`);
});
