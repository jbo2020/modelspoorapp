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
  return (
    <Link
      href={`/collectie/${p.id}`}
      className="card card-hover block group"
    >
      <div className="flex items-stretch gap-3 p-3.5">
        <SerieImage
          serie={p.typeAanduiding ?? null}
          categorie={p.categorie}
          size="sm"
        />
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-baseline justify-between gap-2">
            <span className="eyebrow">{CATEGORIE_LABEL[p.categorie]}</span>
            {p.aantal && p.aantal > 1 && (
              <span className="text-[11px] font-mono text-muted tabular">
                {p.aantal}×
              </span>
            )}
          </div>
          <div className="font-medium truncate text-[15px] leading-tight mt-1">
            {p.merk}
          </div>
          {p.typeAanduiding && (
            <div className="text-xs text-ink2 truncate">{p.typeAanduiding}</div>
          )}
          {p.artikelnummer && (
            <div className="text-[11px] text-muted font-mono tabular mt-1">
              art. {p.artikelnummer}
            </div>
          )}
          <div className="mt-auto pt-2.5 flex items-center gap-1.5 flex-wrap">
            {p.maatschappij && (
              <span className="chip-paper">{p.maatschappij}</span>
            )}
            <TijdperkBadge tijdperk={p.tijdperk} />
          </div>
        </div>
      </div>
    </Link>
  );
}
