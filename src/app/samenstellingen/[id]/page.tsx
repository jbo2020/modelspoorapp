import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import SamenstellingStrip from "@/components/SamenstellingStrip";
import PositieRij from "@/components/PositieRij";
import { suggestiesVoorPositie } from "@/lib/samenstelling/match";

export const dynamic = "force-dynamic";

export default async function SamenstellingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await requireUserId();
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
    include: {
      positie: { select: { id: true } },
    },
  });
  const matchByPositie = new Map(matches.map((m) => [m.positieId, m]));

  // item-data ophalen voor matches om labels te kunnen tonen
  const itemIds = matches.map((m) => m.itemId);
  const items = itemIds.length
    ? await prisma.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, merk: true, typeAanduiding: true, artikelnummer: true },
      })
    : [];
  const itemById = new Map(items.map((i) => [i.id, i]));

  // schaal-hint: meest voorkomende schaal in de collectie van deze gebruiker
  const schaalGroep = await prisma.item.groupBy({
    by: ["schaal"],
    where: { userId, schaal: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { schaal: "desc" } },
    take: 1,
  });
  const schaalHint = schaalGroep[0]?.schaal ?? null;

  // suggesties parallel ophalen
  const suggestiesPerPositie = await Promise.all(
    type.posities.map(async (p) =>
      matchByPositie.has(p.id) ? [] : suggestiesVoorPositie(p, userId, schaalHint),
    ),
  );

  const gematchteIds = new Set(matches.map((m) => m.positieId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {type.lokSerie ?? "Samenstellingstype"}
          {type.omschrijving && (
            <span className="text-muted font-normal"> — {type.omschrijving}</span>
          )}
        </h1>
        <p className="text-sm text-muted">
          {type.aantalPosities} posities
          {type.totaalKlasse && ` · ${type.totaalKlasse}`}
          {" · "}
          {gematchteIds.size}/{type.aantalPosities} gematcht
        </p>
      </div>

      <SamenstellingStrip
        posities={type.posities.map((p) => ({
          id: p.id,
          positie: p.positie,
          vereistCategorie: p.vereistCategorie,
          vereistSerie: p.vereistSerie,
          gematcht: gematchteIds.has(p.id),
        }))}
      />

      <section>
        <h2 className="font-semibold mb-2">Treindiensten</h2>
        {type.treindiensten.length === 0 ? (
          <p className="text-sm text-muted">Geen treindiensten gekoppeld.</p>
        ) : (
          <div className="card divide-y divide-line">
            {type.treindiensten.map((d) => (
              <div key={d.id} className="p-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
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
                {d.dienstdagen && <span className="text-muted">{d.dienstdagen}</span>}
                {d.bron && (
                  <span className="text-muted text-xs">{d.bron}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Posities</h2>
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
                      }
                    : null
                }
                suggesties={suggestiesPerPositie[idx]}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
