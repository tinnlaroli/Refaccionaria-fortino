import { brands } from "@refaccionaria/db";
import { desc, eq, ilike } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { formatZodError, nameZod, slugZod } from "../lib/field-validators.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

const brandSchema = z.object({
  name: nameZod("Nombre de marca"),
  slug: slugZod(),
  isActive: z.boolean().optional(),
});

router.get("/", requireAuth, requirePermission("brands.view"), async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const list = q
    ? await db
        .select()
        .from(brands)
        .where(ilike(brands.name, `%${q}%`))
        .orderBy(brands.name)
        .limit(100)
    : await db.select().from(brands).orderBy(brands.name).limit(200);
  res.json(list);
});

router.post("/", requireAuth, requirePermission("brands.manage"), async (req, res) => {
  const parsed = brandSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [created] = await db
    .insert(brands)
    .values({ ...parsed.data, updatedAt: new Date() })
    .returning();
  await logAudit({
    userId: req.user.sub,
    action: "brand.create",
    entityType: "brand",
    entityId: created.id,
    payload: { name: created.name },
  });
  res.status(201).json(created);
});

router.patch("/:id", requireAuth, requirePermission("brands.manage"), async (req, res) => {
  const parsed = brandSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [updated] = await db
    .update(brands)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(brands.id, String(req.params.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Marca no encontrada" });
    return;
  }
  await logAudit({
    userId: req.user.sub,
    action: "brand.update",
    entityType: "brand",
    entityId: updated.id,
    payload: parsed.data,
  });
  res.json(updated);
});

export default router;
