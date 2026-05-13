// Route-strip — atelier-stijl: groot eindpunten-paar met dunne lijn ertussen,
// monospaced treinnummer + maatschappij-chip + dienstdagen. Geen gradient,
// geen ronde hoeken.

const MIJ_TINT: Record<string, string> = {
  SBB: "bg-sbb/10 text-sbb border-sbb/30",
  CFF: "bg-sbb/10 text-sbb border-sbb/30",
  FFS: "bg-sbb/10 text-sbb border-sbb/30",
  BLS: "bg-amber-100 text-amber-800 border-amber-200",
  SOB: "bg-amber-100 text-amber-800 border-amber-200",
  RhB: "bg-rose-100 text-rose-700 border-rose-200",
  MOB: "bg-blue-100 text-blue-700 border-blue-200",
  DB: "bg-rose-100 text-rose-800 border-rose-200",
  "ÖBB": "bg-rose-50 text-rose-900 border-rose-200",
  SNCF: "bg-sky-100 text-sky-700 border-sky-200",
  NS: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

function tint(mij?: string | null): string {
  if (!mij) return "bg-paper2 text-muted border-line";
  return MIJ_TINT[mij] ?? "bg-paper2 text-muted border-line";
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
  if (!p.routeVan && !p.routeNaar) return null;
  return (
    <div className="panel">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        {p.treinnummer && (
          <span className="font-mono text-sm tracking-wide text-ink font-medium tabular">
            {p.treinnummer}
          </span>
        )}
        {p.jaar && (
          <span className="font-mono text-[11px] text-muted tabular">
            {p.jaar}
          </span>
        )}
        {p.maatschappij && (
          <span className={`chip ${tint(p.maatschappij)}`}>
            {p.maatschappij}
          </span>
        )}
        {p.dienstdagen && (
          <span className="text-[11px] text-muted">{p.dienstdagen}</span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <div className="eyebrow mb-1">van</div>
          <div className="text-lg sm:text-xl font-medium leading-tight tracking-tight">
            {p.routeVan ?? "—"}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 px-2">
          <span className="h-px w-20 bg-rule" />
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            className="text-sbb"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="20" y2="12" />
            <polyline points="14 6 20 12 14 18" />
          </svg>
          <span className="h-px w-20 bg-rule" />
        </div>
        <div>
          <div className="eyebrow mb-1">naar</div>
          <div className="text-lg sm:text-xl font-medium leading-tight tracking-tight">
            {p.routeNaar ?? "—"}
          </div>
        </div>
      </div>
      {p.bron && (
        <div className="mt-3 pt-3 border-t border-line text-[11px] text-muted truncate">
          {p.bron}
        </div>
      )}
    </div>
  );
}
