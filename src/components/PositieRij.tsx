import Link from "next/link";
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
  suggesties: Suggestie[];
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
    suggesties,
  } = props;
  return (
    <div id={`pos-${positie}`} className="p-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-start">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted">
          Positie {positie}
        </div>
        <div className="font-medium">
          {vereistSerie ?? CATEGORIE_LABEL[vereistCategorie as Categorie]}
        </div>
        <div className="text-xs text-muted">
          {CATEGORIE_LABEL[vereistCategorie as Categorie]}
          {vereistKlasse && ` · ${vereistKlasse}e klasse`}
          {vereistRijtuignummer && ` · ${vereistRijtuignummer}`}
        </div>
        {opmerking && <div className="text-xs text-muted italic">{opmerking}</div>}
      </div>

      <div>
        <div className="label">Match</div>
        {match ? (
          <div className="space-y-1">
            <Link
              href={`/collectie/${match.itemId}`}
              className="text-sm font-medium hover:text-sbb"
            >
              {match.itemMerk}
              {match.itemType && ` — ${match.itemType}`}
            </Link>
            {match.itemArtikelnummer && (
              <div className="text-xs text-muted">art. {match.itemArtikelnummer}</div>
            )}
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
          </div>
        ) : suggesties.length === 0 ? (
          <p className="text-sm text-muted">Geen kandidaten in de collectie.</p>
        ) : (
          <ul className="space-y-1">
            {suggesties.map((s) => (
              <li key={s.itemId} className="flex items-center gap-2">
                <form
                  action={async () => {
                    "use server";
                    await setMatchAction(positieId, s.itemId);
                  }}
                >
                  <button className="chip ring-line bg-white text-ink hover:ring-sbb/40">
                    kies
                  </button>
                </form>
                <span className="text-sm truncate">
                  {s.merk}
                  {s.typeAanduiding && ` — ${s.typeAanduiding}`}
                  <span className="text-muted text-xs ml-1">
                    (score {s.score})
                  </span>
                </span>
              </li>
            ))}
          </ul>
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
