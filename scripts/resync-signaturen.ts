// Eenmalige migratie: alle bestaande Samenstellingstypes opnieuw signeren
// met de huidige canonieke signatuur en duplicaten samenvoegen.
//
//   npx tsx scripts/resync-signaturen.ts
//
// Idempotent.

import { prisma } from "../src/lib/prisma";
import {
  afgeleideLokSerie,
  afgeleideTotaalKlasse,
  berekenSignatuurUitPosities,
} from "../src/lib/samenstelling/signatuur";
import type { ParsedSamenstelling } from "../src/lib/samenstelling/parser";

async function main() {
  const types = await prisma.samenstellingstype.findMany({
    include: {
      posities: { orderBy: { positie: "asc" } },
      treindiensten: true,
    },
    orderBy: { createdAt: "asc" }, // oudste eerst → winnaar bij gelijkspel
  });

  console.log(`${types.length} types ingelezen.`);

  // Groepeer op nieuwe canonieke signatuur.
  const groepen = new Map<string, typeof types>();
  for (const t of types) {
    const nieuw = berekenSignatuurUitPosities(
      t.posities.map((p) => ({
        positie: p.positie,
        vereistCategorie: p.vereistCategorie as ParsedSamenstelling["posities"][number]["vereistCategorie"],
        vereistSerie: p.vereistSerie,
        vereistKlasse: p.vereistKlasse,
        vereistRijtuignummer: p.vereistRijtuignummer,
        opmerking: p.opmerking,
      })),
    );
    const lijst = groepen.get(nieuw) ?? [];
    lijst.push(t);
    groepen.set(nieuw, lijst);
  }

  let aangepast = 0;
  let samengevoegd = 0;
  let dienstenVerplaatst = 0;
  let dienstenDeduplicateerd = 0;
  let matchesVerplaatst = 0;

  for (const [nieuweSignatuur, lijst] of groepen.entries()) {
    const winnaar = lijst[0];
    const verliezers = lijst.slice(1);

    // Update winnaar's signatuur (als nodig) — bekijk eerst of er een
    // ander type bestaat met deze signatuur dat niet bij onze groep hoort
    // (kan na vroegere updates). Hier veilig omdat we per groep werken.
    if (winnaar.signatuur !== nieuweSignatuur) {
      // afgeleide velden ook opnieuw zetten
      const helperSam = {
        bestand: "",
        treinnummer: "",
        jaar: null,
        routeVan: null,
        routeNaar: null,
        dienstdagen: null,
        maatschappij: null,
        bron: null,
        omschrijving: null,
        notities: null,
        waarschuwingen: [],
        posities: winnaar.posities.map((p) => ({
          positie: p.positie,
          vereistCategorie: p.vereistCategorie as ParsedSamenstelling["posities"][number]["vereistCategorie"],
          vereistSerie: p.vereistSerie,
          vereistKlasse: p.vereistKlasse,
          vereistRijtuignummer: p.vereistRijtuignummer,
          opmerking: p.opmerking,
        })),
      } as ParsedSamenstelling;
      await prisma.samenstellingstype.update({
        where: { id: winnaar.id },
        data: {
          signatuur: nieuweSignatuur,
          lokSerie: afgeleideLokSerie(helperSam),
          totaalKlasse: afgeleideTotaalKlasse(helperSam),
        },
      });
      aangepast++;
    }

    for (const verliezer of verliezers) {
      // Verplaats Treindiensten — dedup op (typeId, treinnummer, jaar).
      for (const d of verliezer.treindiensten) {
        const bestaand = await prisma.treindienst.findFirst({
          where: {
            typeId: winnaar.id,
            treinnummer: d.treinnummer,
            jaar: d.jaar ?? undefined,
          },
        });
        if (bestaand) {
          await prisma.treindienst.delete({ where: { id: d.id } });
          dienstenDeduplicateerd++;
        } else {
          await prisma.treindienst.update({
            where: { id: d.id },
            data: { typeId: winnaar.id },
          });
          dienstenVerplaatst++;
        }
      }

      // Verplaats matches: vraag eerst alle posities van winnaar op, mapt
      // op (positie-index). Match-rij krijgt de id van de equivalente
      // positie op de winnaar.
      const verliezerPosities = verliezer.posities;
      const winnaarPosities = winnaar.posities;
      const matches = await prisma.samenstellingMatch.findMany({
        where: { positieId: { in: verliezerPosities.map((p) => p.id) } },
      });
      for (const m of matches) {
        const verliezerPos = verliezerPosities.find((p) => p.id === m.positieId);
        if (!verliezerPos) continue;
        // Direction-agnostische signatuur: posities kunnen omgekeerd staan.
        // Probeer eerst exact-positie, anders gespiegelde positie.
        let doelPos = winnaarPosities.find((p) => p.positie === verliezerPos.positie);
        if (!doelPos) {
          const gespiegeld = verliezerPosities.length - 1 - verliezerPos.positie;
          doelPos = winnaarPosities.find((p) => p.positie === gespiegeld);
        }
        if (!doelPos) continue;
        // Verwijder oude rij; voeg opnieuw toe (kan unique conflicten geven).
        await prisma.samenstellingMatch.delete({ where: { id: m.id } });
        await prisma.samenstellingMatch
          .create({
            data: {
              userId: m.userId,
              positieId: doelPos.id,
              itemId: m.itemId,
              accuratesseNote: m.accuratesseNote,
            },
          })
          .catch(() => {
            // bestaande match op de winnaar; laat 'm staan
          });
        matchesVerplaatst++;
      }

      // Verwijder verliezer (cascade ruimt overgebleven positie-rijen op).
      await prisma.samenstellingstype.delete({ where: { id: verliezer.id } });
      samengevoegd++;
    }
  }

  console.log(
    `\nKlaar — ${aangepast} types kregen nieuwe signatuur, ` +
      `${samengevoegd} types samengevoegd. ` +
      `${dienstenVerplaatst} treindiensten verplaatst (${dienstenDeduplicateerd} dubbel ontdaan). ` +
      `${matchesVerplaatst} matches verplaatst.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
