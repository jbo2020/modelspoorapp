// Mooie route-balk voor de samenstellings-detailpagina. Toont
// `routeVan → routeNaar` groot, met daaronder de maatschappij-chip en
// eventuele dienstdagen. Geen kaart (overkill voor deze pilot) maar wel
// een visueel duidelijke richtingstrip.

const MIJ_KLEUR: Record<string, string> = {
  SBB: "bg-sbb/10 text-sbb ring-sbb/30",
  CFF: "bg-sbb/10 text-sbb ring-sbb/30",
  FFS: "bg-sbb/10 text-sbb ring-sbb/30",
  BLS: "bg-amber-100 text-amber-800 ring-amber-200",
  SOB: "bg-amber-100 text-amber-800 ring-amber-200",
  RhB: "bg-rose-100 text-rose-700 ring-rose-200",
  MOB: "bg-blue-100 text-blue-700 ring-blue-200",
  DB: "bg-rose-100 text-rose-800 ring-rose-200",
  "ÖBB": "bg-rose-50 text-rose-900 ring-rose-200",
  SNCF: "bg-sky-100 text-sky-700 ring-sky-200",
  NS: "bg-yellow-100 text-yellow-800 ring-yellow-200",
};

function chipKlasse(mij?: string | null): string {
  if (!mij) return "bg-paper text-muted ring-line";
  return MIJ_KLEUR[mij] ?? "bg-paper text-muted ring-line";
}

export type RouteStripProps = {
  routeVan?: string | null;
  routeNaar?: string | null;
  dienstdagen?: string | null;
  maatschappij?: string | null;
  treinnummer?: string | null;
  jaar?: number | null;
  bron?: string | null;
};

export default function RouteStrip(p: RouteStripProps) {
  if (!p.routeVan && !p.routeNaar) {
    return null;
  }
  return (
    <div className="card p-5 bg-gradient-to-r from-paper to-white">
      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-muted mb-2">
        {p.treinnummer && (
          <span className="font-semibold text-ink text-sm normal-case">
            {p.treinnummer}
          </span>
        )}
        {p.jaar && <span>· {p.jaar}</span>}
        {p.maatschappij && (
          <span className={`chip ring-1 ${chipKlasse(p.maatschappij)}`}>
            {p.maatschappij}
          </span>
        )}
        {p.dienstdagen && <span>· {p.dienstdagen}</span>}
      </div>
      <div className="flex items-center gap-3 flex-wrap text-xl sm:text-2xl font-semibold tracking-tight">
        <span>{p.routeVan ?? "?"}</span>
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          className="text-sbb shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        </svg>
        <span>{p.routeNaar ?? "?"}</span>
      </div>
      {p.bron && (
        <div className="mt-2 text-xs text-muted truncate">Bron: {p.bron}</div>
      )}
    </div>
  );
}
