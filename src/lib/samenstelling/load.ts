// Idempotente upsert van een geparste samenstelling in de DB.
//
// Strategie:
//   1) Bereken signatuur.
//   2) `Samenstellingstype` upserten op signatuur. Bij create maken we
//      ook de bijbehorende SamenstellingPosities aan.
//   3) `Treindienst` upserten op (typeId, treinnummer, jaar) — twee
//      identieke nummers in hetzelfde jaar tellen als één.

import { prisma } from "@/lib/prisma";
import type { ParsedSamenstelling } from "./parser";
import {
  afgeleideLokSerie,
  afgeleideTotaalKlasse,
  berekenSignatuur,
} from "./signatuur";

export type LoadStats = {
  typeCreated: boolean;
  typeId: string;
  treindienstCreated: boolean;
  treindienstId: string;
};

export async function loadSamenstelling(
  s: ParsedSamenstelling,
): Promise<LoadStats> {
  if (!s.treinnummer || s.posities.length === 0) {
    throw new Error(
      `Onvolledig bestand "${s.bestand}": ${s.waarschuwingen.join("; ")}`,
    );
  }

  const signatuur = berekenSignatuur(s);
  let typeRow = await prisma.samenstellingstype.findUnique({
    where: { signatuur },
  });
  let typeCreated = false;
  if (!typeRow) {
    typeRow = await prisma.samenstellingstype.create({
      data: {
        signatuur,
        omschrijving: s.omschrijving,
        aantalPosities: s.posities.length,
        lokSerie: afgeleideLokSerie(s),
        totaalKlasse: afgeleideTotaalKlasse(s),
        eersteBron: s.bron ?? s.bestand,
        posities: {
          create: s.posities.map((p) => ({
            positie: p.positie,
            vereistCategorie: p.vereistCategorie,
            vereistSerie: p.vereistSerie,
            vereistKlasse: p.vereistKlasse,
            vereistRijtuignummer: p.vereistRijtuignummer,
            opmerking: p.opmerking,
          })),
        },
      },
    });
    typeCreated = true;
  } else {
    // Vul ontbrekende metadata aan bij bestaand type.
    const patch: Record<string, unknown> = {};
    if (!typeRow.omschrijving && s.omschrijving) patch.omschrijving = s.omschrijving;
    if (!typeRow.eersteBron && s.bron) patch.eersteBron = s.bron;
    if (Object.keys(patch).length > 0) {
      await prisma.samenstellingstype.update({
        where: { id: typeRow.id },
        data: patch,
      });
    }
  }

  // Treindienst dedupliceren op (typeId, treinnummer, jaar).
  const bestaand = await prisma.treindienst.findFirst({
    where: {
      typeId: typeRow.id,
      treinnummer: s.treinnummer,
      jaar: s.jaar ?? undefined,
    },
  });
  let treindienstRow = bestaand;
  let treindienstCreated = false;
  if (!treindienstRow) {
    treindienstRow = await prisma.treindienst.create({
      data: {
        typeId: typeRow.id,
        treinnummer: s.treinnummer,
        jaar: s.jaar,
        routeVan: s.routeVan,
        routeNaar: s.routeNaar,
        dienstdagen: s.dienstdagen,
        maatschappij: s.maatschappij,
        bron: s.bron,
        notities: s.notities,
      },
    });
    treindienstCreated = true;
  }

  return {
    typeCreated,
    typeId: typeRow.id,
    treindienstCreated,
    treindienstId: treindienstRow.id,
  };
}
