import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import SamenstellingStrip from "@/components/SamenstellingStrip";
import PositieRij from "@/components/PositieRij";
import RouteStrip from "@/components/RouteStrip";
import { suggestiesVoorPositie } from "@/lib/samenstelling/match";
import { autoMatchVoorTypeAction } from "@/lib/samenstelling/actions";

export const dynamic = "force-dynamic";

export default async function SamenstellingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await requireUserId();

  // Auto-match: vul ontbrekende matches in (idempotent; bestaande blijven).
  await autoMatchVoorTypeAction(params.id);

  const type = await prisma.samenstellingstype.findUnique({
    where: { id: params.id },
    include: {
      posities: { orderBy: { positie: "asc" } },
      treindiensten: { orderBy: [{ jaar: "desc" }, { treinnummer: "asc" }] },
    },
  });
  if (!type) notFound();

  const matches = await prisma.samenstellingMatch.findMany({
    where: { userId, positieId: { in: type.posities.map((p) => p.id) } },
  });
  const matchByPositie = new Map(matches.map((m) => [m.positieId, m]));

  const itemIds = matches.map((m) => m.itemId);
  const items = itemIds.length
    ? await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: {
          id: true,
          merk: true,
          typeAanduiding: true,
          artikelnummer: true,
        },
      })
    : [];
  const itemById = new Map(items.map((i) => [i.id, i]));

  // Schaal-hint voor alternatieven (op detailpagina blijven we suggesties
  // tonen voor handmatige overschrijving).
  const schaalGroep = await prisma.item.groupBy({
    by: ["schaal"],
    where: { userId, schaal: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { schaal: "desc" } },
    take: 1,
  });
  const schaalHint = schaalGroep[0]?.schaal ?? null;

  const alternatievenPerPositie = await Promise.all(
    type.posities.map(async (p) => {
      const huidigeMatch = matchByPositie.get(p.id);
      const alle = await suggestiesVoorPositie(p, userId, schaalHint, 5);
      // Geef alternatieven exclusief de huidige match terug
      return alle.filter((s) => s.itemId !== huidigeMatch?.itemId).slice(0, 4);
    }),
  );

  const gematchteIds = new Set(matches.map((m) => m.positieId));
  const eersteTreindienst = type.treindiensten[0];

  return (
    <div className="space-y-6">
      <div>
        <div className="eyebrow mb-1">Samenstellingstype</div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {type.lokSerie ?? "Onbekende rake"}
          {type.omschrijving && (
            <span className="text-muted font-normal"> — {type.omschrijving}</span>
          )}
        </h1>
        <p className="text-sm text-muted mt-1">
          {type.aantalPosities} posities
          {type.totaalKlasse && ` · ${type.totaalKlasse}`}
          {" · "}
          <span className={gematchteIds.size === type.aantalPosities ? "text-sbb font-medium" : ""}>
            {gematchteIds.size}/{type.aantalPosities} gematcht
          </span>
        </p>
      </div>

      {eersteTreindienst && (
        <RouteStrip
          routeVan={eersteTreindienst.routeVan}
          routeNaar={eersteTreindienst.routeNaar}
          dienstdagen={eersteTreindienst.dienstdagen}
          maatschappij={eersteTreindienst.maatschappij}
          treinnummer={eersteTreindienst.treinnummer}
          jaar={eersteTreindienst.jaar}
          bron={eersteTreindienst.bron}
        />
      )}

      <SamenstellingStrip
        posities={type.posities.map((p) => ({
          id: p.id,
          positie: p.positie,
          vereistCategorie: p.vereistCategorie,
          vereistSerie: p.vereistSerie,
          gematcht: gematchteIds.has(p.id),
        }))}
      />

      {type.treindiensten.length > 1 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">
            Andere treindiensten met dezelfde rake ({type.treindiensten.length - 1})
          </h2>
          <div className="card divide-y divide-line">
            {type.treindiensten.slice(1).map((d) => (
              <div
                key={d.id}
                className="p-3 text-sm flex flex-wrap gap-x-4 gap-y-1"
              >
                <span className="font-medium">{d.treinnummer}</span>
                {d.jaar && <span className="text-muted">{d.jaar}</span>}
                {(d.routeVan || d.routeNaar) && (
                  <span>
                    {d.routeVan ?? "?"} → {d.routeNaar ?? "?"}
                  </span>
                )}
                {d.maatschappij && (
                  <span className="chip bg-paper text-muted ring-line">
                    {d.maatschappij}
                  </span>
                )}
                {d.dienstdagen && (
                  <span className="text-muted">{d.dienstdagen}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Posities</h2>
        <div className="card divide-y divide-line">
          {type.posities.map((p, idx) => {
            const m = matchByPositie.get(p.id);
            const it = m ? itemById.get(m.itemId) : null;
            return (
              <PositieRij
                key={p.id}
                positieId={p.id}
                positie={p.positie}
                vereistCategorie={p.vereistCategorie}
                vereistSerie={p.vereistSerie}
                vereistKlasse={p.vereistKlasse}
                vereistRijtuignummer={p.vereistRijtuignummer}
                opmerking={p.opmerking}
                match={
                  m && it
                    ? {
                        itemId: it.id,
                        itemMerk: it.merk,
                        itemType: it.typeAanduiding,
                        itemArtikelnummer: it.artikelnummer,
                        isAuto: m.accuratesseNote === "auto",
                      }
                    : null
                }
                alternatieven={alternatievenPerPositie[idx]}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
