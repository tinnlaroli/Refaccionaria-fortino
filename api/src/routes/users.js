import { roles, users } from "@refaccionaria/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { formatZodError, nameZod, passwordZod } from "../lib/field-validators.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requirePermission("users.manage"), async (_req, res) => {
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      isActive: users.isActive,
      roleId: users.roleId,
      roleName: roles.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id));

  res.json(list);
});

router.post(
  "/",
  requireAuth,
  requirePermission("users.manage"),
  async (req, res) => {
    const schema = z.object({
      email: z.string().trim().email("Correo inválido"),
      password: passwordZod(),
      fullName: nameZod("Nombre completo"),
      roleId: z.string().uuid(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: formatZodError(parsed.error) });
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const [created] = await db
      .insert(users)
      .values({
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        fullName: parsed.data.fullName,
        roleId: parsed.data.roleId,
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        roleId: users.roleId,
        isActive: users.isActive,
      });

    await logAudit({
      userId: req.user.sub,
      action: "user.create",
      entityType: "user",
      entityId: created.id,
    });

    res.status(201).json(created);
  },
);

router.patch(
  "/:id/deactivate",
  requireAuth,
  requirePermission("users.manage"),
  async (req, res) => {
    const [updated] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, String(req.params.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    await logAudit({
      userId: req.user.sub,
      action: "user.deactivate",
      entityType: "user",
      entityId: updated.id,
    });

    res.json(updated);
  },
);

export default router;
