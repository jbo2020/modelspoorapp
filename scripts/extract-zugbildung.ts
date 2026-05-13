// CLI voor de Zugbildungsplan-extractie-pilot.
//
//   npm run zug:pilot -- --file data/zugbildungsplan/Zugbildung_P_2022.txt --limit 5
//
// Stappen:
//   1) lees bestand
//   2) segmenteer in treinblokken
//   3) per blok (binnen --limit): roep Claude aan voor JSON
//   4) loadSamenstelling() voor idempotente upsert in DB
//   5) rapport + log van blokken die faalden (in data/zugbildungsplan/.extract-fouten.log)
//
// --dry-run slaat de LLM-call én DB-upsert over en rapporteert alleen
// hoe het bestand zou segmenteren. Geen API-key nodig.

import { readFile, mkdir, appendFile, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { segmentZugbildung, snelTreinnummerRaden } from "../src/lib/zugbildung/segment";
import { extraheerBlok } from "../src/lib/zugbildung/extract";
import { loadSamenstelling } from "../src/lib/samenstelling/load";
import { prisma } from "../src/lib/prisma";

type Args = {
  file: string;
  limit: number | null;
  from: number;
  to: number | null;
  dryRun: boolean;
  rateMs: number;
};

function parseArgs(argv: string[]): Args {
  const a: Args = {
    file: "data/zugbildungsplan/Zugbildung_P_2022.txt",
    limit: 5,
    from: 0,
    to: null,
    dryRun: false,
    rateMs: 200,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    switch (k) {
      case "--file": a.file = v; i++; break;
      case "--limit": a.limit = parseInt(v, 10); i++; break;
      case "--from": a.from = parseInt(v, 10); i++; break;
      case "--to": a.to = parseInt(v, 10); i++; break;
      case "--rate": a.rateMs = parseInt(v, 10); i++; break;
      case "--dry-run": a.dryRun = true; break;
      case "--all": a.limit = null; break;
      case "--help":
      case "-h":
        console.log(
          [
            "Gebruik: tsx scripts/extract-zugbildung.ts [opties]",
            "  --file <pad>     Pad naar Zugbildungsplan-bestand (default 2022)",
            "  --limit N        Verwerk maximaal N blokken (default 5; '--all' = geen limiet)",
            "  --from N         Start vanaf blok-index N",
            "  --to N           Stop bij blok-index N (exclusief)",
            "  --rate MS        Wachttijd tussen LLM-calls in ms (default 200)",
            "  --dry-run        Alleen segmenteren, geen LLM, geen DB",
            "  --all            Geen limiet (zelfde als --limit Infinity)",
          ].join("\n"),
        );
        process.exit(0);
    }
  }
  return a;
}

function jaarUitNaam(naam: string): number | null {
  // "Zugbildung_P_2022.txt" -> 2022;  "Zugbildung_P_19891990.txt" -> 1989
  const m = naam.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inhoud = await readFile(args.file, "utf-8");
  const jaar = jaarUitNaam(basename(args.file));
  const bron = `Röschus Zugbildungsplan ${basename(args.file)}`;

  const blokken = segmentZugbildung(inhoud);
  const from = Math.max(0, args.from);
  const to = args.to ?? blokken.length;
  const window = blokken.slice(from, to);
  const target = args.limit == null ? window : window.slice(0, args.limit);

  console.log(
    `Bestand: ${args.file}\n` +
      `Jaar:    ${jaar ?? "?"}\n` +
      `Blokken: ${blokken.length} totaal, ${target.length} te verwerken ` +
      `(from=${from}, limit=${args.limit ?? "all"})\n` +
      `Modus:   ${args.dryRun ? "DRY-RUN (geen LLM/DB)" : "live"}`,
  );

  if (args.dryRun) {
    console.log("\n--- voorbeelden (eerste 3 blokken) ---");
    for (const b of target.slice(0, 3)) {
      const treinnummer = snelTreinnummerRaden(b.raw);
      console.log(`#${b.index} treinnummer-gok: ${treinnummer ?? "?"}`);
      console.log(b.raw.slice(0, 240).replace(/\n/g, " | "));
      console.log("");
    }
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "FOUT: ANTHROPIC_API_KEY ontbreekt. Zet de key in .env of run met --dry-run.",
    );
    process.exitCode = 1;
    return;
  }

  await mkdir("data/zugbildungsplan", { recursive: true });
  const foutenLog = "data/zugbildungsplan/.extract-fouten.log";
  await writeFile(foutenLog, "", "utf-8");

  let geslaagd = 0;
  let nieuweTypes = 0;
  let nieuweDiensten = 0;
  let gefaald = 0;

  for (const blok of target) {
    const ruwGok = snelTreinnummerRaden(blok.raw) ?? `#${blok.index}`;
    process.stdout.write(`[${blok.index}] ${ruwGok}: `);

    const res = await extraheerBlok(blok.raw, jaar, bron, basename(args.file));
    if (!res.ok) {
      gefaald++;
      console.log(`FAIL — ${res.fout}`);
      await appendFile(
        foutenLog,
        `--- blok #${blok.index} (${ruwGok}) ---\n${res.fout}\nantwoord:\n${
          res.ruwAntwoord ?? ""
        }\nblok:\n${blok.raw.slice(0, 1500)}\n\n`,
        "utf-8",
      );
      await sleep(args.rateMs);
      continue;
    }
    try {
      const stats = await loadSamenstelling(res.samenstelling);
      geslaagd++;
      if (stats.typeCreated) nieuweTypes++;
      if (stats.treindienstCreated) nieuweDiensten++;
      console.log(
        `${res.samenstelling.treinnummer} (${res.samenstelling.posities.length} pos) ` +
          `type ${stats.typeCreated ? "+" : "="} dienst ${stats.treindienstCreated ? "+" : "="}`,
      );
    } catch (e) {
      gefaald++;
      console.log(`DB-FAIL — ${(e as Error).message}`);
      await appendFile(
        foutenLog,
        `--- blok #${blok.index} DB-FAIL ---\n${(e as Error).message}\nsamenstelling: ${
          JSON.stringify(res.samenstelling, null, 2)
        }\n\n`,
        "utf-8",
      );
    }
    await sleep(args.rateMs);
  }

  console.log(
    `\nKlaar — ${geslaagd} blokken geslaagd, ${gefaald} mislukt. ` +
      `${nieuweTypes} nieuwe Samenstellingstypes, ${nieuweDiensten} nieuwe Treindiensten.`,
  );
  if (gefaald > 0) console.log(`Foutendetails in ${foutenLog}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
