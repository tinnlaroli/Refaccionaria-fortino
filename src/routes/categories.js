import { categories } from "@refaccionaria/db";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const list = await db.select().from(categories);
  res.json(list);
});

router.post(
  "/",
  requireAuth,
  requirePermission("products.create"),
  async (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const [created] = await db.insert(categories).values(parsed.data).returning();
    res.status(201).json(created);
  },
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("products.edit"),
  async (req, res) => {
    const schema = z.object({
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const [updated] = await db
      .update(categories)
      .set(parsed.data)
      .where(eq(categories.id, String(req.params.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Categoría no encontrada" });
      return;
    }

    res.json(updated);
  },
);

export default router;
