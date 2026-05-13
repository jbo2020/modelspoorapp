import { prisma } from "./prisma";
import { allConnectors } from "./connectors";
import type { RawHit } from "./connectors";
import { looksRelevant, withinBudget } from "./connectors/base";
import type { MarktplaatsTreffer, WishlistItem } from "@prisma/client";
import { notifyNewHits } from "./notify";

export type { RawHit };

export type ScanReport = {
  perBron: Record<
    string,
    { gevonden: number; nieuw: number; overgeslagen?: boolean; fout?: string }
  >;
  totaalNieuw: number;
};

export async function scanForUser(userId: string): Promise<ScanReport> {
  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId, actief: true },
  });
  if (wishlist.length === 0) {
    return { perBron: {}, totaalNieuw: 0 };
  }

  const connectors = allConnectors();
  const report: ScanReport = { perBron: {}, totaalNieuw: 0 };
  const allNewHits: Array<{ wishlist: WishlistItem; treffer: MarktplaatsTreffer }> = [];

  for (const conn of connectors) {
    if (!conn.isEnabled()) {
      report.perBron[conn.bron] = { gevonden: 0, nieuw: 0, overgeslagen: true };
      continue;
    }
    let gevonden = 0;
    let nieuw = 0;
    try {
      for (const item of wishlist) {
        let raw: RawHit[] = [];
        try {
          raw = await conn.search(item);
        } catch (e) {
          // per-item fout: log en ga door met volgende item
          console.error(`${conn.bron} search error for ${item.id}: ${(e as Error).message}`);
          continue;
        }
        for (const hit of raw) {
          if (!looksRelevant(item, hit)) continue;
          if (!withinBudget(item, hit)) continue;
          gevonden++;
          const created = await prisma.marktplaatsTreffer
            .create({
              data: {
                userId,
                wishlistItemId: item.id,
                bron: conn.bron,
                externId: hit.externId,
                titel: hit.titel,
                url: hit.url,
                prijs: hit.prijs ?? null,
                valuta: hit.valuta ?? "EUR",
                thumbnailUrl: hit.thumbnailUrl ?? null,
                beschrijving: hit.beschrijving ?? null,
                vondsttijdstip: hit.vondsttijdstip ?? new Date(),
                status: "NIEUW",
              },
            })
            .catch((e: { code?: string }) => {
              // P2002 = unique constraint (userId+bron+externId): al gezien
              if (e?.code === "P2002") return null;
              throw e;
            });
          if (created) {
            nieuw++;
            allNewHits.push({ wishlist: item, treffer: created });
          }
        }
      }
      await prisma.connectorState.upsert({
        where: { userId_bron: { userId, bron: conn.bron } },
        update: { laatsteScan: new Date(), laatsteFout: null },
        create: { userId, bron: conn.bron, laatsteScan: new Date() },
      });
      report.perBron[conn.bron] = { gevonden, nieuw };
    } catch (e) {
      const msg = (e as Error).message;
      await prisma.connectorState
        .upsert({
          where: { userId_bron: { userId, bron: conn.bron } },
          update: { laatsteFout: msg, laatsteScan: new Date() },
          create: { userId, bron: conn.bron, laatsteFout: msg, laatsteScan: new Date() },
        })
        .catch(() => {});
      report.perBron[conn.bron] = { gevonden, nieuw, fout: msg };
    }
    report.totaalNieuw += nieuw;
  }

  if (allNewHits.length > 0) {
    try {
      await notifyNewHits(userId, allNewHits);
    } catch (e) {
      console.error("notify error", e);
    }
  }
  return report;
}
