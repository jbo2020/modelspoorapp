// Server-component die een Wikipedia-thumbnail toont voor een gegeven
// serie-aanduiding. Cache-hit = direct beeld; miss = fetch nu (kan een
// paginalaad vertragen bij de allereerste view, daarna nooit meer).
// Bij geen hit valt 'ie terug op de bestaande SVG-CategoryIcon.

import { CategoryIcon } from "./Icons";
import type { Categorie } from "@/lib/types";
import { getSerieImage } from "@/lib/series-images";

type Props = {
  serie: string | null | undefined;
  categorie: Categorie;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-12 w-20",
  md: "h-20 w-32",
  lg: "h-32 w-48",
};

export default async function SerieImage({
  serie,
  categorie,
  size = "md",
  className = "",
}: Props) {
  const data = serie ? await getSerieImage(serie) : null;
  const box = `${SIZE_CLASSES[size]} ${className} flex-shrink-0 rounded-md overflow-hidden ring-1 ring-line bg-paper`;

  if (data?.thumbUrl) {
    return (
      <div className={box}>
        <a
          href={data.source ?? "#"}
          target="_blank"
          rel="noreferrer"
          title={data.caption ?? serie ?? ""}
          className="block h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.thumbUrl}
            alt={data.caption ?? serie ?? ""}
            loading="lazy"
            className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </a>
      </div>
    );
  }
  return (
    <div className={`${box} flex items-center justify-center text-ink/70`}>
      <CategoryIcon categorie={categorie} size={size === "lg" ? 36 : size === "sm" ? 20 : 28} />
    </div>
  );
}
