// Dump alle Samenstellingstypes uit de DB die uit de Zugbildungsplan-
// extractie komen (filter op `bron` of `eersteBron` met "Röschus") naar
// één JSON-bestand dat met scripts/import-samenstellingen-json.ts
// elders opnieuw in een DB geladen kan worden. Idempotent op signatuur.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { prisma } from "../src/lib/prisma";

const DEFAULT_OUT = "data/zugbildungsplan/pilot-2022.json";

export type DumpedType = {
  signatuur: string;
  omschrijving: string | null;
  aantalPosities: number;
  lokSerie: string | null;
  totaalKlasse: string | null;
  eersteBron: string | null;
  posities: Array<{
    positie: number;
    vereistCategorie: string;
    vereistSerie: string | null;
    vereistKlasse: string | null;
    vereistRijtuignummer: string | null;
    opmerking: string | null;
  }>;
  treindiensten: Array<{
    treinnummer: string;
    jaar: number | null;
    routeVan: string | null;
    routeNaar: string | null;
    dienstdagen: string | null;
    maatschappij: string | null;
    bron: string | null;
    notities: string | null;
  }>;
};

async function main() {
  const out = process.argv[2] ?? DEFAULT_OUT;
  const filter = process.env.SAM_DUMP_BRON ?? "Röschus";

  const types = await prisma.samenstellingstype.findMany({
    where: {
      OR: [
        { eersteBron: { contains: filter } },
        { treindiensten: { some: { bron: { contains: filter } } } },
      ],
    },
    include: {
      posities: { orderBy: { positie: "asc" } },
      treindiensten: { orderBy: [{ jaar: "asc" }, { treinnummer: "asc" }] },
    },
    orderBy: [{ lokSerie: "asc" }, { aantalPosities: "asc" }],
  });

  const payload: DumpedType[] = types.map((t) => ({
    signatuur: t.signatuur,
    omschrijving: t.omschrijving,
    aantalPosities: t.aantalPosities,
    lokSerie: t.lokSerie,
    totaalKlasse: t.totaalKlasse,
    eersteBron: t.eersteBron,
    posities: t.posities.map((p) => ({
      positie: p.positie,
      vereistCategorie: p.vereistCategorie,
      vereistSerie: p.vereistSerie,
      vereistKlasse: p.vereistKlasse,
      vereistRijtuignummer: p.vereistRijtuignummer,
      opmerking: p.opmerking,
    })),
    treindiensten: t.treindiensten.map((d) => ({
      treinnummer: d.treinnummer,
      jaar: d.jaar,
      routeVan: d.routeVan,
      routeNaar: d.routeNaar,
      dienstdagen: d.dienstdagen,
      maatschappij: d.maatschappij,
      bron: d.bron,
      notities: d.notities,
    })),
  }));

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  console.log(
    `${types.length} types geschreven naar ${out} ` +
      `(${payload.reduce((n, t) => n + t.treindiensten.length, 0)} treindiensten, ` +
      `${payload.reduce((n, t) => n + t.posities.length, 0)} posities).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
