import { roles } from "@refaccionaria/db";
import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("users.manage"),
  async (_req, res) => {
    const list = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
      })
      .from(roles)
      .orderBy(roles.name);

    res.json(list);
  },
);

export default router;
