// Positie-rij — ledger-stijl voor de samenstelling-detailpagina.
// Twee kolommen: vereiste (links, mono-volgnummer + serie + klasse) en
// match-status (rechts, item-link of "geen match" met actie-knoppen).

import Link from "next/link";
import SerieImage from "./SerieImage";
import WagenFeatures from "./WagenFeatures";
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
      className="grid grid-cols-1 md:grid-cols-[60px_72px_minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-4 items-center p-4"
    >
      <span className="font-mono text-[12px] text-muted tabular">
        {String(positie).padStart(2, "0")}
      </span>

      <SerieImage
        serie={vereistSerie}
        categorie={vereistCategorie as Categorie}
        size="sm"
      />

      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">
          {vereistSerie ?? CATEGORIE_LABEL[vereistCategorie as Categorie]}
        </div>
        <div className="text-[11px] text-muted">
          {CATEGORIE_LABEL[vereistCategorie as Categorie]}
          {vereistKlasse && ` · ${vereistKlasse}e klasse`}
          {vereistRijtuignummer && (
            <>
              {" · "}
              <span className="font-mono tabular">{vereistRijtuignummer}</span>
            </>
          )}
        </div>
        <WagenFeatures opmerking={opmerking} />
      </div>

      <div className="min-w-0">
        {match ? (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/collectie/${match.itemId}`}
                className="text-[13px] font-medium hover:text-sbb truncate"
              >
                {match.itemMerk}
                {match.itemType && ` — ${match.itemType}`}
              </Link>
              {match.isAuto && (
                <span className="chip-ghost text-[10px] uppercase tracking-eyebrow">
                  auto
                </span>
              )}
            </div>
            {match.itemArtikelnummer && (
              <div className="text-[11px] text-muted font-mono tabular">
                art. {match.itemArtikelnummer}
              </div>
            )}
            {alternatieven.length > 0 && (
              <details className="text-[11px] mt-1">
                <summary className="cursor-pointer text-muted hover:text-ink">
                  {alternatieven.length} alternatief
                  {alternatieven.length === 1 ? "" : "ven"}
                </summary>
                <ul className="mt-1.5 space-y-1">
                  {alternatieven.map((s) => (
                    <li key={s.itemId} className="flex items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await setMatchAction(positieId, s.itemId);
                        }}
                      >
                        <button className="chip-ghost hover:border-ink">
                          kies
                        </button>
                      </form>
                      <span className="truncate text-ink2">
                        {s.merk}
                        {s.typeAanduiding && ` — ${s.typeAanduiding}`}
                        <span className="text-muted font-mono tabular ml-1.5 text-[10px]">
                          {s.score}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ) : (
          <span className="text-[12px] text-muted italic">
            geen collectie-match
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        {match ? (
          <form
            action={async () => {
              "use server";
              await clearMatchAction(positieId);
            }}
          >
            <button className="btn-ghost text-[11px]">wis</button>
          </form>
        ) : (
          <form
            action={async () => {
              "use server";
              await positieNaarWensenlijstAction(positieId);
            }}
          >
            <button className="btn text-[11px]">→ wensenlijst</button>
          </form>
        )}
      </div>
    </div>
  );
}
