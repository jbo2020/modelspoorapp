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
    <div className="card p-4 overflow-x-auto">
      <div className="flex items-end gap-2 min-w-max">
        {posities.map((p) => (
          <a
            key={p.id}
            href={`#pos-${p.positie}`}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-md ring-1 transition-shadow ${
              p.gematcht
                ? "ring-sbb/40 bg-sbb/5 shadow-sm"
                : "ring-line bg-paper hover:ring-ink/30"
            }`}
            title={p.vereistSerie ?? p.vereistCategorie}
          >
            <SerieImage
              serie={p.vereistSerie}
              categorie={p.vereistCategorie as Categorie}
              size="sm"
            />
            <span className="text-[10px] text-muted whitespace-nowrap max-w-[80px] truncate">
              {p.vereistSerie ?? "—"}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
