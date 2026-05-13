import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import SamenstellingStrip from "@/components/SamenstellingStrip";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SamenstellingenPage({
  searchParams,
}: {
  searchParams: { q?: string; maat?: string; lok?: string; jaar?: string };
}) {
  const userId = await requireUserId();

  const treindienstWhere: Prisma.TreindienstWhereInput = {};
  if (searchParams.maat) treindienstWhere.maatschappij = searchParams.maat;
  if (searchParams.jaar) treindienstWhere.jaar = parseInt(searchParams.jaar, 10);
  if (searchParams.q) {
    treindienstWhere.OR = [
      { treinnummer: { contains: searchParams.q } },
      { routeVan: { contains: searchParams.q } },
      { routeNaar: { contains: searchParams.q } },
    ];
  }

  const typeWhere: Prisma.SamenstellingstypeWhereInput = {};
  if (searchParams.lok) typeWhere.lokSerie = searchParams.lok;
  if (Object.keys(treindienstWhere).length > 0) {
    typeWhere.treindiensten = { some: treindienstWhere };
  }

  const [types, alleMaat, alleLok, alleJaar, mijnMatches] = await Promise.all([
    prisma.samenstellingstype.findMany({
      where: typeWhere,
      include: {
        posities: { orderBy: { positie: "asc" } },
        treindiensten: { orderBy: [{ jaar: "desc" }, { treinnummer: "asc" }] },
      },
      orderBy: [{ lokSerie: "asc" }, { aantalPosities: "asc" }],
      take: 200,
    }),
    prisma.treindienst.findMany({
      distinct: ["maatschappij"],
      where: { maatschappij: { not: null } },
      select: { maatschappij: true },
      orderBy: { maatschappij: "asc" },
    }),
    prisma.samenstellingstype.findMany({
      distinct: ["lokSerie"],
      where: { lokSerie: { not: null } },
      select: { lokSerie: true },
      orderBy: { lokSerie: "asc" },
    }),
    prisma.treindienst.findMany({
      distinct: ["jaar"],
      where: { jaar: { not: null } },
      select: { jaar: true },
      orderBy: { jaar: "desc" },
    }),
    prisma.samenstellingMatch.findMany({
      where: { userId },
      select: { positieId: true },
    }),
  ]);

  const gematchteIds = new Set(mijnMatches.map((m) => m.positieId));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Samenstellingen</h1>
          <p className="text-sm text-muted">
            Echte treinsamenstellingen. Klik door om je collectie tegen een
            samenstelling te leggen.
          </p>
        </div>
        <span className="text-xs text-muted">
          {types.length} {types.length === 1 ? "type" : "types"}
        </span>
      </div>

      <form className="card p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="text-xs">
          <span className="label">Zoek</span>
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="treinnummer of route"
            className="input"
          />
        </label>
        <label className="text-xs">
          <span className="label">Maatschappij</span>
          <select name="maat" defaultValue={searchParams.maat ?? ""} className="input">
            <option value="">alle</option>
            {alleMaat.map((m) => (
              <option key={m.maatschappij} value={m.maatschappij!}>
                {m.maatschappij}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="label">Loc-serie</span>
          <select name="lok" defaultValue={searchParams.lok ?? ""} className="input">
            <option value="">alle</option>
            {alleLok.map((l) => (
              <option key={l.lokSerie} value={l.lokSerie!}>
                {l.lokSerie}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="label">Jaar</span>
          <select name="jaar" defaultValue={searchParams.jaar ?? ""} className="input">
            <option value="">alle</option>
            {alleJaar.map((j) => (
              <option key={j.jaar} value={String(j.jaar)}>
                {j.jaar}
              </option>
            ))}
          </select>
        </label>
        <div className="col-span-2 sm:col-span-4 flex gap-2">
          <button className="btn-primary" type="submit">Filter</button>
          <Link className="btn" href="/samenstellingen">Reset</Link>
        </div>
      </form>

      {types.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">
          Nog geen samenstellingen geladen. Plaats .txt-bestanden in{" "}
          <code>samenstellingen/</code> en draai <code>npm run sam:load</code>.
          Zie <code>docs/samenstellingen-format.md</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {types.map((t) => {
            const gematcht = t.posities.filter((p) => gematchteIds.has(p.id)).length;
            return (
              <Link
                key={t.id}
                href={`/samenstellingen/${t.id}`}
                className="card p-4 hover:border-sbb/30 transition block"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div>
                    <div className="font-semibold">
                      {t.lokSerie ?? "—"}
                      {t.omschrijving && (
                        <span className="text-muted font-normal">
                          {" "}· {t.omschrijving}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {t.aantalPosities} posities
                      {t.totaalKlasse && ` · ${t.totaalKlasse}`}
                      {" · "}
                      <span
                        className={
                          gematcht === t.aantalPosities
                            ? "text-sbb"
                            : "text-muted"
                        }
                      >
                        {gematcht}/{t.aantalPosities} gematcht
                      </span>
                    </div>
                  </div>
                  <span className="chip bg-paper text-muted ring-line">
                    {t.treindiensten.length}{" "}
                    {t.treindiensten.length === 1 ? "trein" : "treinen"}
                  </span>
                </div>
                <SamenstellingStrip
                  posities={t.posities.map((p) => ({
                    id: p.id,
                    positie: p.positie,
                    vereistCategorie: p.vereistCategorie,
                    vereistSerie: p.vereistSerie,
                    gematcht: gematchteIds.has(p.id),
                  }))}
                />
                <div className="text-xs text-muted mt-2 truncate">
                  {t.treindiensten.slice(0, 4).map((d) => (
                    <span key={d.id} className="mr-2">
                      {d.treinnummer}
                      {d.jaar ? ` (${d.jaar})` : ""}
                    </span>
                  ))}
                  {t.treindiensten.length > 4 && (
                    <span>+{t.treindiensten.length - 4}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
