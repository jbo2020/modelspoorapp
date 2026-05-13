import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import SamenstellingStrip from "@/components/SamenstellingStrip";
import PositieRij from "@/components/PositieRij";
import RouteStrip from "@/components/RouteStrip";
import SerieImage from "@/components/SerieImage";
import { PageHeader } from "@/components/Frame";
import { suggestiesVoorPositie } from "@/lib/samenstelling/match";
import { autoMatchVoorTypeAction } from "@/lib/samenstelling/actions";
import { treinTitel } from "@/lib/samenstelling/titel";

export const dynamic = "force-dynamic";

export default async function SamenstellingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await requireUserId();

  // Auto-match: ontbrekende matches vullen (idempotent).
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
      return alle.filter((s) => s.itemId !== huidigeMatch?.itemId).slice(0, 4);
    }),
  );

  const gematchteIds = new Set(matches.map((m) => m.positieId));
  const eersteTreindienst = type.treindiensten[0];
  const titel = treinTitel(eersteTreindienst, type);
  const ontbreken = type.aantalPosities - gematchteIds.size;

  return (
    <div>
      <PageHeader
        eyebrow={`Samenstelling · ${type.lokSerie ?? "rake"} · ${type.aantalPosities} posities`}
        title={titel}
        lede={
          ontbreken === 0
            ? `Alle ${type.aantalPosities} posities zijn gedekt door je collectie.`
            : ontbreken === type.aantalPosities
            ? `Nog geen enkele positie van deze rake zit in je collectie. ${
                eersteTreindienst?.routeVan && eersteTreindienst.routeNaar
                  ? `${eersteTreindienst.routeVan} → ${eersteTreindienst.routeNaar}.`
                  : ""
              }`
            : `${gematchteIds.size} van de ${type.aantalPosities} posities zijn gedekt; ${ontbreken} ${
                ontbreken === 1 ? "positie ontbreekt" : "posities ontbreken"
              } nog.`
        }
      />

      {/* DEKKING band — donker, full-bleed, editorial */}
      <section className="-mx-6 sm:-mx-9 mb-7 px-6 sm:px-9 py-7 bg-ink text-white">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-8 items-center">
          <div className="font-serif leading-[0.85] tracking-[-0.04em] flex items-baseline gap-1">
            <span className="text-[88px] sm:text-[110px] font-normal">
              {gematchteIds.size}
            </span>
            <span className="text-[88px] sm:text-[110px] font-normal text-white/30">
              /{type.aantalPosities}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5 uppercase tracking-eyebrowWide text-[10px] text-white/55 font-medium">
              <span aria-hidden className="inline-block w-3.5 h-px bg-white" />
              Dekking in de collectie
            </div>
            <div className="font-serif text-[22px] sm:text-[26px] leading-tight tracking-[-0.025em] mt-2.5 max-w-[44ch]">
              {ontbreken === 0
                ? "Volledig gedekt — alles aanwezig."
                : ontbreken === type.aantalPosities
                ? "Nog geen onderdelen — een rake om te verzamelen."
                : `Nog ${ontbreken} ${ontbreken === 1 ? "rijtuig" : "rijtuigen"} te gaan voor een volledige rake.`}
            </div>
            <div className="mt-5 flex gap-1 flex-wrap">
              {type.posities.map((p) => (
                <span
                  key={p.id}
                  className="block h-1.5 w-7"
                  style={{
                    background: gematchteIds.has(p.id)
                      ? "#C5051C"
                      : "rgba(255,255,255,0.16)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 mb-6">
        {/* Hero — locomotief foto */}
        <div className="panel flex items-start gap-4">
          <SerieImage
            serie={type.lokSerie ?? type.posities[0]?.vereistSerie ?? null}
            categorie={
              (type.posities[0]?.vereistCategorie ?? "LOCOMOTIEF") as
                | "LOCOMOTIEF"
                | "PERSONENRIJTUIG"
                | "GOEDERENWAGON"
                | "SMALSPOOR"
                | "TREINSTEL"
            }
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="eyebrow mb-1">Locomotief</div>
            <div className="text-lg font-medium leading-tight">
              {type.lokSerie ?? "—"}
            </div>
            {type.totaalKlasse && (
              <div className="text-[12px] text-muted mt-1">
                Klasses {type.totaalKlasse}
              </div>
            )}
            <div className="text-[12px] text-muted mt-3 font-mono tabular">
              {type.aantalPosities} posities ·{" "}
              {type.treindiensten.length} treindiensten
            </div>
          </div>
        </div>

        {/* Route */}
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
      </div>

      <div className="mb-6">
        <SamenstellingStrip
          posities={type.posities.map((p) => ({
            id: p.id,
            positie: p.positie,
            vereistCategorie: p.vereistCategorie,
            vereistSerie: p.vereistSerie,
            gematcht: gematchteIds.has(p.id),
          }))}
        />
      </div>

      {type.treindiensten.length > 1 && (
        <section className="mb-6">
          <div className="section-label">
            <span>
              Andere treindiensten met deze rake ({type.treindiensten.length - 1})
            </span>
          </div>
          <div className="card divide-y divide-line">
            {type.treindiensten.slice(1).map((d) => (
              <div
                key={d.id}
                className="p-3 text-sm flex flex-wrap gap-x-4 gap-y-1 items-center"
              >
                <span className="font-mono tabular font-medium text-ink">
                  {d.treinnummer}
                </span>
                {d.jaar && (
                  <span className="font-mono tabular text-muted">{d.jaar}</span>
                )}
                {(d.routeVan || d.routeNaar) && (
                  <span className="text-ink2">
                    {d.routeVan ?? "?"} → {d.routeNaar ?? "?"}
                  </span>
                )}
                {d.maatschappij && (
                  <span className="chip-paper">{d.maatschappij}</span>
                )}
                {d.dienstdagen && (
                  <span className="text-[11px] text-muted">{d.dienstdagen}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="section-label">
          <span>Posities</span>
          <span className="font-mono tabular">
            {gematchteIds.size}/{type.aantalPosities}
          </span>
        </div>
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
