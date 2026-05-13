import Link from "next/link";
import SerieImage from "./SerieImage";
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
      className="card card-hover p-3 group block"
    >
      <div className="flex items-start gap-3">
        <SerieImage
          serie={p.typeAanduiding ?? null}
          categorie={p.categorie}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="eyebrow">
            {CATEGORIE_LABEL[p.categorie]}
            {p.aantal && p.aantal > 1 ? ` · ${p.aantal}×` : ""}
          </div>
          <div className="font-medium truncate">{title}</div>
          {p.artikelnummer && (
            <div className="text-xs text-muted">art. {p.artikelnummer}</div>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-xs flex-wrap">
            {p.maatschappij && (
              <span className="chip bg-paper text-muted ring-line">
                {p.maatschappij}
              </span>
            )}
            <TijdperkBadge tijdperk={p.tijdperk} />
          </div>
        </div>
      </div>
    </Link>
  );
}
