// Zugbildungsplan-wagon-strip — atelier-stijl. Onder elke positie de
// volgnummer (klein, mono) + serie-aanduiding. Een gematchte positie
// krijgt een SBB-rood streepje aan de onderkant; een ontbrekende een
// rode hairline-rand.

import SerieImage from "./SerieImage";
import type { Categorie } from "@/lib/types";

type Pos = {
  id: string;
  positie: number;
  vereistCategorie: string;
  vereistSerie: string | null;
  gematcht: boolean;
};

export default function SamenstellingStrip({ posities }: { posities: Pos[] }) {
  return (
    <div className="panel overflow-x-auto">
      <div className="eyebrow mb-3">Zugbildung</div>
      <div className="flex items-stretch gap-2 min-w-max">
        {posities.map((p) => (
          <a
            key={p.id}
            href={`#pos-${p.positie}`}
            className={`group flex flex-col items-center gap-1.5 p-2 border bg-white transition-colors hover:bg-paper2/40 ${
              p.gematcht
                ? "border-line border-b-2 border-b-sbb"
                : "border-sbb/30 border-dashed"
            }`}
            title={p.vereistSerie ?? p.vereistCategorie}
            style={{ minWidth: 88 }}
          >
            <SerieImage
              serie={p.vereistSerie}
              categorie={p.vereistCategorie as Categorie}
              size="sm"
            />
            <span className="font-mono text-[10px] text-muted tabular leading-none">
              {String(p.positie).padStart(2, "0")}
            </span>
            <span className="text-[11px] text-ink2 text-center whitespace-nowrap max-w-[88px] truncate leading-tight">
              {p.vereistSerie ?? "—"}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
