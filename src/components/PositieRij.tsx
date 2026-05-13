import Link from "next/link";
import SerieImage from "./SerieImage";
import { CATEGORIE_LABEL, type Categorie } from "@/lib/types";
import type { Suggestie } from "@/lib/samenstelling/match";
import {
  clearMatchAction,
  positieNaarWensenlijstAction,
  setMatchAction,
} from "@/lib/samenstelling/actions";

type Match = {
  itemId: string;
  itemMerk: string;
  itemType: string | null;
  itemArtikelnummer: string | null;
  isAuto: boolean;
};

export default function PositieRij(props: {
  positieId: string;
  positie: number;
  vereistCategorie: string;
  vereistSerie: string | null;
  vereistKlasse: string | null;
  vereistRijtuignummer: string | null;
  opmerking: string | null;
  match: Match | null;
  alternatieven: Suggestie[];
}) {
  const {
    positieId,
    positie,
    vereistCategorie,
    vereistSerie,
    vereistKlasse,
    vereistRijtuignummer,
    opmerking,
    match,
    alternatieven,
  } = props;

  return (
    <div
      id={`pos-${positie}`}
      className="p-4 grid grid-cols-1 sm:grid-cols-[64px_1fr_1fr_auto] gap-4 items-start"
    >
      <SerieImage
        serie={vereistSerie}
        categorie={vereistCategorie as Categorie}
        size="sm"
      />

      <div>
        <div className="eyebrow">Positie {positie}</div>
        <div className="font-medium">
          {vereistSerie ?? CATEGORIE_LABEL[vereistCategorie as Categorie]}
        </div>
        <div className="text-xs text-muted">
          {CATEGORIE_LABEL[vereistCategorie as Categorie]}
          {vereistKlasse && ` · ${vereistKlasse}e klasse`}
          {vereistRijtuignummer && ` · ${vereistRijtuignummer}`}
        </div>
        {opmerking && (
          <div className="text-xs text-muted italic mt-1">{opmerking}</div>
        )}
      </div>

      <div>
        <div className="label">Match</div>
        {match ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/collectie/${match.itemId}`}
                className="text-sm font-medium hover:text-sbb"
              >
                {match.itemMerk}
                {match.itemType && ` — ${match.itemType}`}
              </Link>
              {match.isAuto && (
                <span className="chip bg-paper text-muted ring-line text-[10px]">
                  auto
                </span>
              )}
            </div>
            {match.itemArtikelnummer && (
              <div className="text-xs text-muted">
                art. {match.itemArtikelnummer}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1 pt-1">
              <form
                action={async () => {
                  "use server";
                  await clearMatchAction(positieId);
                }}
              >
                <button className="chip ring-line bg-white text-muted hover:text-sbb">
                  wis match
                </button>
              </form>
              {alternatieven.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted hover:text-ink">
                    {alternatieven.length} alternatief
                    {alternatieven.length === 1 ? "" : "ven"}
                  </summary>
                  <ul className="mt-1 space-y-1">
                    {alternatieven.map((s) => (
                      <li key={s.itemId} className="flex items-center gap-2">
                        <form
                          action={async () => {
                            "use server";
                            await setMatchAction(positieId, s.itemId);
                          }}
                        >
                          <button className="chip ring-line bg-white hover:ring-sbb/40">
                            kies
                          </button>
                        </form>
                        <span className="truncate">
                          {s.merk}
                          {s.typeAanduiding && ` — ${s.typeAanduiding}`}
                          <span className="text-muted ml-1">
                            (score {s.score})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Geen passende collectie-item.</p>
        )}
      </div>

      <div>
        {!match && (
          <form
            action={async () => {
              "use server";
              await positieNaarWensenlijstAction(positieId);
            }}
          >
            <button className="btn text-sm" title="Voeg toe aan wensenlijst">
              → wensenlijst
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
