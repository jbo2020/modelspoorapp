// Tijdelijke opslag van geüploade dozen-foto's. Foto's worden NIET
// gekoppeld aan items (foto's per modelitem zijn expliciet buiten scope
// volgens §1 van het ontwerp). Ze blijven alleen bewaard tussen
// upload en bevestiging, en worden vanzelf opgeruimd na ttlMs.

import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const ROOT = process.env.FOTO_TMP_ROOT ?? join(process.cwd(), "tmp", "fotos");
const TTL_MS = 60 * 60 * 1000; // 1 uur

type Stored = {
  id: string;
  userId: string;
  mime: string;
  ext: string;
};

function safeExt(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/heic" || mime === "image/heif") return "heic";
  return "jpg";
}

async function ensureRoot(): Promise<void> {
  await mkdir(ROOT, { recursive: true });
}

async function gc(): Promise<void> {
  try {
    const now = Date.now();
    const files = await readdir(ROOT);
    for (const f of files) {
      const p = join(ROOT, f);
      const s = await stat(p).catch(() => null);
      if (!s) continue;
      if (now - s.mtimeMs > TTL_MS) await unlink(p).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export async function storePhoto(
  userId: string,
  buf: Buffer,
  mime: string,
): Promise<Stored> {
  await ensureRoot();
  await gc();
  const ext = safeExt(mime);
  const id = randomBytes(16).toString("hex");
  // Embed userId in filename for ownership check at read time.
  const filename = `${id}__${userId}.${ext}`;
  await writeFile(join(ROOT, filename), buf);
  return { id, userId, mime, ext };
}

export async function readPhoto(
  id: string,
  userId: string,
): Promise<{ buf: Buffer; mime: string } | null> {
  if (!/^[a-f0-9]{32}$/.test(id)) return null;
  await ensureRoot();
  const files = await readdir(ROOT).catch(() => [] as string[]);
  const match = files.find((f) => f.startsWith(`${id}__${userId}.`));
  if (!match) return null;
  const ext = match.split(".").pop() ?? "jpg";
  const mime =
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" :
    ext === "heic" ? "image/heic" :
    "image/jpeg";
  const buf = await readFile(join(ROOT, match));
  return { buf, mime };
}

export async function deletePhoto(id: string, userId: string): Promise<void> {
  if (!/^[a-f0-9]{32}$/.test(id)) return;
  const files = await readdir(ROOT).catch(() => [] as string[]);
  const match = files.find((f) => f.startsWith(`${id}__${userId}.`));
  if (match) await unlink(join(ROOT, match)).catch(() => {});
}
