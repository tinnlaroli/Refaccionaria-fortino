import { suppliers } from "@refaccionaria/db";
import { desc, eq, ilike } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { formatZodError, nameZod } from "../lib/field-validators.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

const supplierSchema = z.object({
  name: nameZod("Nombre del proveedor"),
  contactName: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email("Correo inválido").optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

router.get("/", requireAuth, requirePermission("suppliers.view"), async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const list = q
    ? await db
        .select()
        .from(suppliers)
        .where(ilike(suppliers.name, `%${q}%`))
        .orderBy(desc(suppliers.updatedAt))
        .limit(100)
    : await db.select().from(suppliers).orderBy(desc(suppliers.updatedAt)).limit(200);
  res.json(list);
});

router.post("/", requireAuth, requirePermission("suppliers.manage"), async (req, res) => {
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [created] = await db
    .insert(suppliers)
    .values({
      ...parsed.data,
      email: parsed.data.email || null,
      updatedAt: new Date(),
    })
    .returning();
  await logAudit({
    userId: req.user.sub,
    action: "supplier.create",
    entityType: "supplier",
    entityId: created.id,
    payload: { name: created.name },
  });
  res.status(201).json(created);
});

router.patch("/:id", requireAuth, requirePermission("suppliers.manage"), async (req, res) => {
  const parsed = supplierSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const data = { updatedAt: new Date(), ...parsed.data };
  if (parsed.data.email === "") data.email = null;
  const [updated] = await db
    .update(suppliers)
    .set(data)
    .where(eq(suppliers.id, String(req.params.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Proveedor no encontrado" });
    return;
  }
  await logAudit({
    userId: req.user.sub,
    action: "supplier.update",
    entityType: "supplier",
    entityId: updated.id,
    payload: parsed.data,
  });
  res.json(updated);
});

export default router;
