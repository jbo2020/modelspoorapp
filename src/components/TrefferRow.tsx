import { setTrefferStatusAction } from "@/lib/wishlist";

export type TrefferRowData = {
  id: string;
  titel: string;
  url: string;
  bron: string;
  prijs?: number | null;
  valuta?: string | null;
  vondsttijdstip: Date;
  status: string;
  beschrijving?: string | null;
};

const BRON_LABEL: Record<string, string> = {
  EBAY: "eBay",
  MARKTPLAATS_MAIL: "Marktplaats",
  TWEEDEHANDS_MAIL: "2dehands",
  CATAWIKI_RSS: "Catawiki",
};

function fmtPrijs(p?: number | null, valuta?: string | null) {
  if (p == null) return "—";
  try {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: valuta || "EUR",
    }).format(p);
  } catch {
    return `${p}`;
  }
}

function fmtDatum(d: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function TrefferRow({ treffer }: { treffer: TrefferRowData }) {
  const statusChip =
    treffer.status === "NIEUW"
      ? "bg-sbb/10 text-sbb ring-sbb/30"
      : treffer.status === "GEKOCHT"
      ? "bg-era-5/10 text-era-5 ring-era-5/30"
      : treffer.status === "AFGEWEZEN"
      ? "bg-paper text-muted ring-line line-through"
      : "bg-paper text-muted ring-line";

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="chip bg-paper ring-line">
            {BRON_LABEL[treffer.bron] ?? treffer.bron}
          </span>
          <span>{fmtDatum(treffer.vondsttijdstip)}</span>
        </div>
        <a
          href={treffer.url}
          target="_blank"
          rel="noreferrer"
          className="font-medium hover:text-sbb block truncate"
        >
          {treffer.titel}
        </a>
        {treffer.beschrijving && (
          <p className="text-xs text-muted line-clamp-2">{treffer.beschrijving}</p>
        )}
      </div>
      <div className="text-sm font-medium tabular-nums">
        {fmtPrijs(treffer.prijs, treffer.valuta)}
      </div>
      <span className={`chip ${statusChip}`}>{treffer.status}</span>
      <div className="flex flex-wrap gap-1">
        {(["GEZIEN", "GEKOCHT", "AFGEWEZEN"] as const).map((s) => (
          <form
            key={s}
            action={async () => {
              "use server";
              await setTrefferStatusAction(treffer.id, s);
            }}
          >
            <button
              className="chip bg-white ring-line text-muted hover:text-ink hover:ring-ink/30"
              type="submit"
              title={`Markeer als ${s.toLowerCase()}`}
            >
              {s.toLowerCase()}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
