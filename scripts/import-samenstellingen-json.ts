// Idempotent import van een JSON-dump (zie scripts/dump-samenstellingen.ts).
// Bevat geen LLM-calls — gewoon DB-upserts. Gebruik:
//
//   npm run sam:import -- data/zugbildungsplan/pilot-2022.json
//
// Per type: upsert op `signatuur`. Bij create maken we ook posities aan.
// Per treindienst: findFirst op (typeId, treinnummer, jaar); alleen
// creëren als nog niet aanwezig. Volledig idempotent.

import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";
import type { DumpedType } from "./dump-samenstellingen";

const DEFAULT_IN = "data/zugbildungsplan/pilot-2022.json";

async function main() {
  const inputPath = process.argv[2] ?? DEFAULT_IN;
  const inhoud = await readFile(inputPath, "utf-8");
  const payload = JSON.parse(inhoud) as DumpedType[];

  let typesNieuw = 0;
  let typesBestond = 0;
  let dienstenNieuw = 0;
  let dienstenBestond = 0;

  for (const t of payload) {
    let row = await prisma.samenstellingstype.findUnique({
      where: { signatuur: t.signatuur },
    });
    if (!row) {
      row = await prisma.samenstellingstype.create({
        data: {
          signatuur: t.signatuur,
          omschrijving: t.omschrijving,
          aantalPosities: t.aantalPosities,
          lokSerie: t.lokSerie,
          totaalKlasse: t.totaalKlasse,
          eersteBron: t.eersteBron,
          posities: { create: t.posities.map((p) => ({ ...p })) },
        },
      });
      typesNieuw++;
    } else {
      // Idempotent verversen van afgeleide metadata zodat verbeterde
      // heuristieken (lokSerie/totaalKlasse/omschrijving) doorwerken
      // zonder de posities of matches te raken.
      if (
        row.lokSerie !== t.lokSerie ||
        row.totaalKlasse !== t.totaalKlasse ||
        row.omschrijving !== t.omschrijving
      ) {
        await prisma.samenstellingstype.update({
          where: { id: row.id },
          data: {
            lokSerie: t.lokSerie,
            totaalKlasse: t.totaalKlasse,
            omschrijving: t.omschrijving,
          },
        });
      }
      // Ververs ook de positie-opmerkingen (wagen-features) idempotent.
      for (const p of t.posities) {
        await prisma.samenstellingPositie.updateMany({
          where: { typeId: row.id, positie: p.positie },
          data: { opmerking: p.opmerking ?? null },
        });
      }
      typesBestond++;
    }

    for (const d of t.treindiensten) {
      const bestaand = await prisma.treindienst.findFirst({
        where: {
          typeId: row.id,
          treinnummer: d.treinnummer,
          jaar: d.jaar ?? undefined,
        },
      });
      if (bestaand) {
        dienstenBestond++;
        continue;
      }
      await prisma.treindienst.create({
        data: {
          typeId: row.id,
          treinnummer: d.treinnummer,
          jaar: d.jaar,
          routeVan: d.routeVan,
          routeNaar: d.routeNaar,
          dienstdagen: d.dienstdagen,
          maatschappij: d.maatschappij,
          bron: d.bron,
          notities: d.notities,
        },
      });
      dienstenNieuw++;
    }
  }

  console.log(
    `Klaar — ${typesNieuw} nieuwe types (${typesBestond} bestonden), ` +
      `${dienstenNieuw} nieuwe treindiensten (${dienstenBestond} bestonden).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
