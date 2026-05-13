// Matching tussen een SamenstellingPositie en items in de eigen
// collectie. Conform §5 van het ontwerp:
//   - categorie en schaal zijn hard (must)
//   - merk is bonus (gebruikersvoorkeur)
//   - type/klasse zijn gewenst
//   - rijtuignummer is grote bonus
// De gebruiker bevestigt zelf de match — we sorteren puur op score en
// laten de top-N zien.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type Suggestie = {
  itemId: string;
  merk: string;
  typeAanduiding: string | null;
  artikelnummer: string | null;
  maatschappij: string | null;
  schaal: string | null;
  wagennummer: string | null;
  score: number;
};

type PositieMinimaal = {
  vereistCategorie: string;
  vereistSerie: string | null;
  vereistKlasse: string | null;
  vereistRijtuignummer: string | null;
};

function neem<T>(x: T | undefined | null): x is T {
  return x != null;
}

export async function suggestiesVoorPositie(
  positie: PositieMinimaal,
  userId: string,
  schaalHint?: string | null,
  limit = 5,
): Promise<Suggestie[]> {
  const where: Prisma.ItemWhereInput = {
    userId,
    categorie: positie.vereistCategorie,
    status: "IN_BEZIT",
  };
  if (schaalHint) where.schaal = schaalHint;

  const items = await prisma.item.findMany({
    where,
    include: {
      loc: true,
      personen: true,
      goederen: true,
      smal: true,
      treinstel: true,
    },
    take: 200, // ruim genoeg om binnen één categorie te scoren
  });

  const serie = positie.vereistSerie?.toLowerCase() ?? null;
  const klasse = positie.vereistKlasse?.toLowerCase() ?? null;
  const uic = positie.vereistRijtuignummer?.toLowerCase() ?? null;

  const scored: Suggestie[] = [];
  for (const it of items) {
    let score = 1;
    const type = (it.typeAanduiding ?? "").toLowerCase();
    if (serie && type.includes(serie)) score += 5;
    if (klasse && type.includes(klasse)) score += 2;

    const itemWagenNr =
      it.personen?.wagennummer ??
      it.goederen?.wagennummer ??
      it.smal?.wagennummer ??
      null;
    if (uic && itemWagenNr && itemWagenNr.toLowerCase() === uic) score += 10;

    // Locomotieven matchen ook op loknummer als positie een nummer noemt.
    if (
      positie.vereistCategorie === "LOCOMOTIEF" &&
      uic &&
      it.loc?.loknummer &&
      it.loc.loknummer.toLowerCase() === uic
    ) {
      score += 10;
    }

    scored.push({
      itemId: it.id,
      merk: it.merk,
      typeAanduiding: it.typeAanduiding,
      artikelnummer: it.artikelnummer,
      maatschappij: it.maatschappij,
      schaal: it.schaal,
      wagennummer: itemWagenNr,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).filter(neem);
}
