// Eén entry-point voor serie-afbeeldingen. DB-cache als voorkant,
// Wikipedia als backstop, 14-dagen TTL voor positieve hits en 1-dag voor
// negatieve hits (zodat we sneller opnieuw proberen als een nieuwe foto
// online komt).

import { prisma } from "@/lib/prisma";
import { hoofdType, normalizeSerieKey } from "./normalize";
import { zoekWikipediaImage } from "./wikipedia";

const TTL_OK_MS = 14 * 24 * 60 * 60 * 1000;
const TTL_FAIL_MS = 24 * 60 * 60 * 1000;

export type SerieImageData = {
  serie: string;
  imageUrl: string | null;
  thumbUrl: string | null;
  caption: string | null;
  source: string | null;
};

function isVers(fetchedAt: Date, hasImage: boolean): boolean {
  const leeftijd = Date.now() - fetchedAt.getTime();
  return leeftijd < (hasImage ? TTL_OK_MS : TTL_FAIL_MS);
}

/** Haal de afbeelding op voor een serie-aanduiding. Hergebruikt cache;
 *  fetcht via Wikipedia als nodig. Faalt zacht: null-resultaat is
 *  acceptabel voor de UI (valt terug op CategoryIcon). */
export async function getSerieImage(
  rauweInput: string,
): Promise<SerieImageData | null> {
  const trimmed = rauweInput.trim();
  if (!trimmed) return null;
  const hoofd = hoofdType(trimmed);
  const key = normalizeSerieKey(hoofd);
  if (!key) return null;

  const bestaand = await prisma.serieImage.findUnique({ where: { serie: key } });
  if (bestaand && isVers(bestaand.fetchedAt, !!bestaand.imageUrl)) {
    return toData(bestaand);
  }

  // Zoek via Wikipedia.
  let hit;
  try {
    hit = await zoekWikipediaImage(hoofd);
  } catch (e) {
    await prisma.serieImage.upsert({
      where: { serie: key },
      update: { fetchedAt: new Date(), fout: (e as Error).message },
      create: {
        serie: key,
        rauweInput: hoofd,
        fout: (e as Error).message,
      },
    });
    return null;
  }
  if (!hit) {
    await prisma.serieImage.upsert({
      where: { serie: key },
      update: {
        fetchedAt: new Date(),
        imageUrl: null,
        thumbUrl: null,
        caption: null,
        source: null,
        language: null,
        fout: "geen Wikipedia-hit",
      },
      create: { serie: key, rauweInput: hoofd, fout: "geen Wikipedia-hit" },
    });
    return null;
  }

  const opgeslagen = await prisma.serieImage.upsert({
    where: { serie: key },
    update: {
      rauweInput: hoofd,
      imageUrl: hit.imageUrl,
      thumbUrl: hit.thumbUrl,
      caption: hit.caption,
      source: hit.source,
      language: hit.language,
      fetchedAt: new Date(),
      fout: null,
    },
    create: {
      serie: key,
      rauweInput: hoofd,
      imageUrl: hit.imageUrl,
      thumbUrl: hit.thumbUrl,
      caption: hit.caption,
      source: hit.source,
      language: hit.language,
    },
  });
  return toData(opgeslagen);
}

function toData(row: {
  serie: string;
  imageUrl: string | null;
  thumbUrl: string | null;
  caption: string | null;
  source: string | null;
}): SerieImageData {
  return {
    serie: row.serie,
    imageUrl: row.imageUrl,
    thumbUrl: row.thumbUrl,
    caption: row.caption,
    source: row.source,
  };
}

/** Bulk-variant: haal in parallel afbeeldingen voor meerdere series op.
 *  Returneert een Map keyed op de oorspronkelijke input. Cache-hits gaan
 *  zonder netwerkverkeer; misses worden sequentieel opgehaald om
 *  Wikipedia rustig te bevragen (max 1 in-flight per call). */
export async function getSerieImages(
  inputs: string[],
): Promise<Map<string, SerieImageData | null>> {
  const out = new Map<string, SerieImageData | null>();
  const uniek = Array.from(new Set(inputs.map((s) => s.trim()).filter(Boolean)));
  // Eerst alle cache-hits in één query.
  const keys = uniek.map((s) => normalizeSerieKey(hoofdType(s)));
  const cached = await prisma.serieImage.findMany({
    where: { serie: { in: keys } },
  });
  const cacheByKey = new Map(cached.map((c) => [c.serie, c]));
  const teFetchen: string[] = [];
  for (const s of uniek) {
    const key = normalizeSerieKey(hoofdType(s));
    const row = cacheByKey.get(key);
    if (row && isVers(row.fetchedAt, !!row.imageUrl)) {
      out.set(s, toData(row));
    } else {
      teFetchen.push(s);
    }
  }
  // Misses sequentieel ophalen om Wikipedia niet te belasten.
  for (const s of teFetchen) {
    out.set(s, await getSerieImage(s));
  }
  return out;
}
