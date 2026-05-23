import { permissions, rolePermissions, roles, users } from "@refaccionaria/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { signAccessToken, signRefreshToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const perms = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, user.roleId));

  const roleRow = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.id, user.roleId))
    .limit(1);

  const payload = {
    sub: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: roleRow[0]?.name ?? "unknown",
    permissions: perms.map((p) => p.key),
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({
    sub: user.id,
    email: user.email,
  });

  await logAudit({
    userId: user.id,
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: payload.roleName,
      permissions: payload.permissions,
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, req.user.sub))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json({
    ...user,
    role: req.user.roleName,
    permissions: req.user.permissions,
  });
});

export default router;
