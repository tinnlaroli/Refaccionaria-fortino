import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mediaDir = path.join(__dirname, "..", "seed", "media");
const manifestPath = path.join(mediaDir, "manifest.json");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

await mkdir(mediaDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (const item of manifest) {
  const outPath = path.join(mediaDir, `${item.slug}.jpg`);
  try {
    await access(outPath);
    console.log(`[fetch:stock-media] ${item.slug}.jpg (omitido, ya existe)`);
    continue;
  } catch {
    /* download */
  }

  let lastError = null;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const res = await fetch(item.thumbUrl, {
      headers: { "User-Agent": "RefaccionariaFortino/1.0 (seed; dev)" },
    });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(outPath, buf);
      console.log(`[fetch:stock-media] ${item.slug}.jpg (${buf.length} bytes)`);
      lastError = null;
      break;
    }
    lastError = new Error(`No se pudo descargar ${item.slug}: ${res.status}`);
    if (res.status === 429 && attempt < 5) {
      await sleep(2500 * attempt);
      continue;
    }
    throw lastError;
  }

  if (lastError) throw lastError;
  await sleep(1200);
}

console.log(`[fetch:stock-media] ${manifest.length} imágenes listas en ${mediaDir}`);
