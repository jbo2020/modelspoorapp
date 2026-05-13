// Generate PNG app icons from public/icons/icon.svg.
// Run via: node scripts/generate-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const svgPath = join(root, "public/icons/icon.svg");
const outDir = join(root, "public/icons");
const svg = readFileSync(svgPath);

const targets = [
  { size: 180, file: "icon-180.png" },
  { size: 192, file: "icon-192.png" },
  { size: 512, file: "icon-512.png" },
];

for (const { size, file } of targets) {
  const buf = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(join(outDir, file), buf);
  console.log(`wrote ${file} (${size}x${size}, ${buf.length} bytes)`);
}

// Maskable icon: PWAs expect ~10% safe-area padding so the icon stays visible
// when the OS applies a circular/squircle mask.
const maskBase = await sharp(svg).resize(154, 154).png().toBuffer();
const maskable = await sharp({
  create: {
    width: 192,
    height: 192,
    channels: 4,
    background: "#FAF8F5",
  },
})
  .composite([{ input: maskBase, top: 19, left: 19 }])
  .png()
  .toBuffer();
writeFileSync(join(outDir, "icon-192-maskable.png"), maskable);
console.log(`wrote icon-192-maskable.png (192x192, ${maskable.length} bytes)`);
