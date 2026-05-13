import { CategoryIcon } from "./Icons";
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
            className={`flex flex-col items-center gap-1 px-1.5 py-1 rounded-md ring-1 ${
              p.gematcht
                ? "ring-sbb/40 bg-sbb/5"
                : "ring-line bg-paper hover:ring-ink/30"
            }`}
            title={p.vereistSerie ?? p.vereistCategorie}
          >
            <CategoryIcon
              categorie={p.vereistCategorie as Categorie}
              size={20}
            />
            <span className="text-[10px] text-muted whitespace-nowrap">
              {p.vereistSerie ?? "—"}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
