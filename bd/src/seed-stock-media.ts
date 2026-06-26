import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";
import { mediaAssets, products } from "./schema.js";

type Db = PostgresJsDatabase<typeof schema>;

type StockManifestItem = {
  slug: string;
  name: string;
  tags: string[];
  commonsFile: string;
  thumbUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  productSku?: string;
};

const SEED_TAG_PREFIX = "seed-stock:";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.join(__dirname, "..", "seed", "media");
const manifestPath = path.join(mediaDir, "manifest.json");

function mimeFromFilename(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function loadManifest(): Promise<StockManifestItem[]> {
  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw) as StockManifestItem[];
}

async function readImageBase64(slug: string) {
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    const filePath = path.join(mediaDir, `${slug}${ext}`);
    try {
      const buf = await readFile(filePath);
      const mimeType = mimeFromFilename(filePath);
      return {
        mimeType,
        url: `data:${mimeType};base64,${buf.toString("base64")}`,
      };
    } catch {
      /* try next extension */
    }
  }
  throw new Error(
    `Falta archivo de imagen para "${slug}". Ejecuta: npm run fetch:stock-media`,
  );
}

async function findExistingAsset(db: Db, seedTag: string) {
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(sql`${seedTag} = ANY(${mediaAssets.tags})`)
    .limit(1);
  return rows[0] ?? null;
}

export async function seedStockMedia(db: Db, uploadedBy: string | null) {
  const manifest = await loadManifest();
  console.log(`[seed] Biblioteca demo: ${manifest.length} imágenes (Wikimedia Commons)`);

  const assetIdsBySlug = new Map<string, string>();

  for (const item of manifest) {
    const seedTag = `${SEED_TAG_PREFIX}${item.slug}`;
    const tags = [...item.tags, seedTag, "wikimedia"];

    let asset = await findExistingAsset(db, seedTag);

    if (!asset) {
      const { mimeType, url } = await readImageBase64(item.slug);
      const [created] = await db
        .insert(mediaAssets)
        .values({
          name: item.name,
          tags,
          mimeType,
          url,
          uploadedBy,
        })
        .returning();
      asset = created;
      console.log(`[seed]   + ${item.name}`);
    } else {
      console.log(`[seed]   = ${item.name} (ya existe)`);
    }

    assetIdsBySlug.set(item.slug, asset.id);
  }

  for (const item of manifest) {
    if (!item.productSku) continue;
    const mediaId = assetIdsBySlug.get(item.slug);
    if (!mediaId) continue;

    const [product] = await db
      .select({ id: products.id, primaryMediaId: products.primaryMediaId })
      .from(products)
      .where(eq(products.sku, item.productSku))
      .limit(1);

    if (product && product.primaryMediaId !== mediaId) {
      await db.update(products).set({ primaryMediaId: mediaId }).where(eq(products.id, product.id));
      console.log(`[seed]   → ${item.productSku} vinculado a imagen demo`);
    }
  }
}
