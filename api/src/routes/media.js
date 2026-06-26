import { mediaAssets } from "@refaccionaria/db";
import { desc, eq, ilike } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { logAudit } from "../lib/audit.js";
import { formatZodError, nameZod } from "../lib/field-validators.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

const MAX_BYTES = 1_500_000;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const uploadSchema = z.object({
  name: nameZod("Nombre de la imagen"),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  mimeType: z.string().refine((v) => ALLOWED_MIME.has(v), "Formato no permitido"),
  dataBase64: z.string().min(1),
});

router.get("/", requireAuth, requirePermission("media.view"), async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
  const tag = typeof req.query.tag === "string" ? req.query.tag.trim().toLowerCase() : "";

  let list = q
    ? await db
        .select()
        .from(mediaAssets)
        .where(ilike(mediaAssets.name, `%${q}%`))
        .orderBy(desc(mediaAssets.createdAt))
        .limit(120)
    : await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(120);

  if (q) {
    const byName = new Set(list.map((m) => m.id));
    const extra = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(200);
    for (const item of extra) {
      if (byName.has(item.id)) continue;
      const haystack = `${item.name} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      if (haystack.includes(q)) list.push(item);
    }
  }

  if (tag) {
    list = list.filter((item) =>
      (item.tags ?? []).some((t) => t.toLowerCase().includes(tag)),
    );
  }

  res.json(list.slice(0, 120));
});

router.post("/", requireAuth, requirePermission("media.upload"), async (req, res) => {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const raw = parsed.data.dataBase64.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.byteLength(raw, "base64");
  if (bytes > MAX_BYTES) {
    res.status(400).json({ error: "La imagen supera 1.5 MB" });
    return;
  }

  const url = `data:${parsed.data.mimeType};base64,${raw}`;
  const [created] = await db
    .insert(mediaAssets)
    .values({
      name: parsed.data.name,
      tags: parsed.data.tags ?? [],
      mimeType: parsed.data.mimeType,
      url,
      uploadedBy: req.user.sub,
    })
    .returning();

  await logAudit({
    userId: req.user.sub,
    action: "media.upload",
    entityType: "media_asset",
    entityId: created.id,
    payload: { name: created.name },
  });

  res.status(201).json(created);
});

router.patch("/:id", requireAuth, requirePermission("media.upload"), async (req, res) => {
  const parsed = z
    .object({
      name: nameZod("Nombre").optional(),
      tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }
  const [updated] = await db
    .update(mediaAssets)
    .set(parsed.data)
    .where(eq(mediaAssets.id, String(req.params.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Imagen no encontrada" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", requireAuth, requirePermission("media.upload"), async (req, res) => {
  const [removed] = await db
    .delete(mediaAssets)
    .where(eq(mediaAssets.id, String(req.params.id)))
    .returning({ id: mediaAssets.id });
  if (!removed) {
    res.status(404).json({ error: "Imagen no encontrada" });
    return;
  }
  res.status(204).end();
});

export default router;
