// CLI: leest alle .txt-bestanden in samenstellingen/ (instelbaar via
// SAMENSTELLINGEN_DIR), parset, dedupliceert en upsert in de DB.
//
//   npm run sam:load
//
// Idempotent: opnieuw draaien voegt geen duplicates toe.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseSamenstelling } from "../src/lib/samenstelling/parser";
import { loadSamenstelling } from "../src/lib/samenstelling/load";
import { prisma } from "../src/lib/prisma";

const DIR = process.env.SAMENSTELLINGEN_DIR ?? join(process.cwd(), "samenstellingen");

async function main() {
  const files = (await readdir(DIR).catch(() => [] as string[]))
    .filter((f) => f.toLowerCase().endsWith(".txt"))
    .sort();
  if (files.length === 0) {
    console.log(`Geen .txt-bestanden gevonden in ${DIR}.`);
    return;
  }
  let typesNew = 0;
  let diensteNew = 0;
  let totaalWaarschuwingen = 0;
  const fouten: string[] = [];

  for (const f of files) {
    const inhoud = await readFile(join(DIR, f), "utf-8");
    const parsed = parseSamenstelling(f, inhoud);
    if (parsed.waarschuwingen.length > 0) {
      totaalWaarschuwingen += parsed.waarschuwingen.length;
      for (const w of parsed.waarschuwingen) {
        console.warn(`  ${f}: ${w}`);
      }
    }
    try {
      const stats = await loadSamenstelling(parsed);
      if (stats.typeCreated) typesNew++;
      if (stats.treindienstCreated) diensteNew++;
      console.log(
        `${f}: type ${stats.typeCreated ? "+" : "="} ` +
          `dienst ${stats.treindienstCreated ? "+" : "="}`,
      );
    } catch (e) {
      fouten.push(`${f}: ${(e as Error).message}`);
    }
  }

  console.log("");
  console.log(
    `Klaar — ${files.length} bestanden, ${typesNew} nieuwe types, ` +
      `${diensteNew} nieuwe treindiensten, ${totaalWaarschuwingen} waarschuwingen.`,
  );
  if (fouten.length > 0) {
    console.error("Fouten:");
    for (const e of fouten) console.error(`  ${e}`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
