import Link from "next/link";
import { CategoryIcon } from "./Icons";
import TijdperkBadge from "./TijdperkBadge";
import type { Categorie } from "@/lib/types";
import { CATEGORIE_LABEL } from "@/lib/types";

type Props = {
  id: string;
  categorie: Categorie;
  merk: string;
  typeAanduiding?: string | null;
  artikelnummer?: string | null;
  maatschappij?: string | null;
  tijdperk?: string | null;
  aantal?: number | null;
};

export default function ItemCard(p: Props) {
  const title =
    [p.merk, p.typeAanduiding].filter(Boolean).join(" — ") || p.merk;
  return (
    <Link
      href={`/collectie/${p.id}`}
      className="card p-4 hover:border-sbb/30 hover:shadow-sm transition group block"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-ink/80 group-hover:text-sbb transition-colors">
          <CategoryIcon categorie={p.categorie} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-muted">
            {CATEGORIE_LABEL[p.categorie]}
            {p.aantal && p.aantal > 1 ? ` · ${p.aantal}×` : ""}
          </div>
          <div className="font-medium truncate">{title}</div>
          {p.artikelnummer && (
            <div className="text-xs text-muted">art. {p.artikelnummer}</div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
        {p.maatschappij && (
          <span className="chip bg-paper text-muted ring-line">{p.maatschappij}</span>
        )}
        <TijdperkBadge tijdperk={p.tijdperk} />
      </div>
    </Link>
  );
}
