import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import SamenstellingStrip from "@/components/SamenstellingStrip";
import { PageHeader } from "@/components/Frame";
import { treinTitel } from "@/lib/samenstelling/titel";
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
      take: 500,
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

  // Sorteer: samenstellingen waarvan de gebruiker de meeste posities al heeft → eerst.
  // Ties op aantal gematcht; daarna op aantalPosities desc; daarna alfabetisch op lokSerie.
  const verrijkt = types.map((t) => {
    const matched = t.posities.filter((p) => gematchteIds.has(p.id)).length;
    return { ...t, matched };
  });
  verrijkt.sort((a, b) => {
    if (b.matched !== a.matched) return b.matched - a.matched;
    if (b.aantalPosities !== a.aantalPosities) return b.aantalPosities - a.aantalPosities;
    return (a.lokSerie ?? "").localeCompare(b.lokSerie ?? "");
  });

  return (
    <div>
      <PageHeader
        eyebrow="Treinsamenstellingen"
        title="Samenstellingen"
        actions={
          <span className="font-mono text-xs text-muted tabular">
            {verrijkt.length} type{verrijkt.length === 1 ? "" : "s"}
          </span>
        }
      />

      <form className="card p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {verrijkt.length === 0 ? (
        <div className="empty-state">
          Nog geen samenstellingen geladen. Plaats .txt-bestanden in{" "}
          <code className="font-mono text-ink">samenstellingen/</code> of draai{" "}
          <code className="font-mono text-ink">npm run zug:pilot -- --file ... --all</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {verrijkt.map((t) => {
            const dienst = t.treindiensten[0];
            const titel = treinTitel(dienst, t);
            const dekking = t.matched / t.aantalPosities;
            const dekkingTint =
              dekking === 1 ? "text-accentGreen" :
              dekking >= 0.5 ? "text-accentYellow" :
              t.matched > 0 ? "text-sbb" :
              "text-muted";
            return (
              <Link
                key={t.id}
                href={`/samenstellingen/${t.id}`}
                className="card card-hover block"
              >
                <div className="p-4 flex items-start justify-between gap-3 border-b border-line">
                  <div className="min-w-0">
                    <div className="eyebrow mb-1">{t.lokSerie ?? "—"} · {t.aantalPosities} posities</div>
                    <div className="font-medium text-[15px] leading-tight truncate">
                      {titel}
                    </div>
                    {dienst && (dienst.routeVan || dienst.routeNaar) && (
                      <div className="text-[12px] text-ink2 mt-1 truncate">
                        {dienst.routeVan ?? "?"} → {dienst.routeNaar ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-mono text-base tabular leading-none ${dekkingTint}`}>
                      {t.matched}
                      <span className="text-muted">/{t.aantalPosities}</span>
                    </div>
                    <div className="eyebrow mt-1">in collectie</div>
                  </div>
                </div>
                <div className="p-2">
                  <SamenstellingStrip
                    posities={t.posities.map((p) => ({
                      id: p.id,
                      positie: p.positie,
                      vereistCategorie: p.vereistCategorie,
                      vereistSerie: p.vereistSerie,
                      gematcht: gematchteIds.has(p.id),
                    }))}
                  />
                </div>
                <div className="px-4 py-2 border-t border-line text-[11px] text-muted flex items-center gap-2 flex-wrap font-mono tabular">
                  {t.treindiensten.slice(0, 4).map((d) => (
                    <span key={d.id}>
                      {d.treinnummer}
                      {d.jaar ? ` ${d.jaar}` : ""}
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
