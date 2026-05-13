// Stabiele signatuur voor ontdubbeling van Samenstellingstypes.
//
// Volgens §4 en §6 van het ontwerp: dezelfde loc-serie, dezelfde
// rijtuig-series, dezelfde klassen → één type. UIC-rijtuignummers en
// opmerkingen blijven buiten de signatuur (positie-niveau detail, niet
// type-niveau).
//
// Direction-onafhankelijk: een rake en zijn omkering vormen één type.
// We berekenen de signatuur in beide richtingen en nemen de lexicografisch
// kleinste als canonieke vorm. Daardoor vallen heen- en terugrichting van
// dezelfde rake samen (zoals ICE 4 trein 3 ↔ trein 4 in de pilot).

import type { ParsedPositie, ParsedSamenstelling } from "./parser";
import { createHash } from "node:crypto";

function normSerie(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/[.,/\\]/g, " ")     // dots, komma's, slashes wegwerken
    .replace(/\s+/g, " ")
    .trim();
}

function normKlasse(k: string | null | undefined): string {
  return (k ?? "").toLowerCase().replace(/[\se]/g, "");
}

function categorieKort(c: string): string {
  switch (c) {
    case "LOCOMOTIEF": return "L";
    case "PERSONENRIJTUIG": return "P";
    case "GOEDERENWAGON": return "G";
    case "SMALSPOOR": return "S";
    case "TREINSTEL": return "T";
    default: return "?";
  }
}

export function positieDeel(p: ParsedPositie): string {
  return `${categorieKort(p.vereistCategorie)}:${normSerie(p.vereistSerie)}@${normKlasse(p.vereistKlasse)}`;
}

/** Direction-agnostische signatuur. Posities worden zowel forward als
 *  reverse gehasht; de lexicografisch kleinste van de twee is de
 *  canonieke vorm. Resultaat: <hash>::<delen> waarbij <delen> de canonieke
 *  richting is, voor menselijke debug. */
export function berekenSignatuur(s: ParsedSamenstelling): string {
  return berekenSignatuurUitPosities(s.posities);
}

export function berekenSignatuurUitPosities(posities: ParsedPositie[]): string {
  const forward = posities.map(positieDeel).join("||");
  const reverse = posities.slice().reverse().map(positieDeel).join("||");
  const canoniek = forward <= reverse ? forward : reverse;
  const hash = createHash("sha256").update(canoniek).digest("hex").slice(0, 16);
  return `${hash}::${canoniek}`;
}

/** Lok-serie afleiden: eerst een LOCOMOTIEF-positie zoeken; bij self-aangedreven
 *  treinstellen (geen LOCOMOTIEF aanwezig) vallen we terug op de eerste
 *  TREINSTEL-positie. Zo krijgen ICE 4-rakes uit de pilot ook een `lokSerie`. */
export function afgeleideLokSerie(s: ParsedSamenstelling): string | null {
  const loc = s.posities.find((p) => p.vereistCategorie === "LOCOMOTIEF");
  if (loc?.vereistSerie) return loc.vereistSerie;
  const trein = s.posities.find((p) => p.vereistCategorie === "TREINSTEL");
  if (trein?.vereistSerie) {
    // Voor "ICE 4 Bpmdzf5812.0" willen we als lokSerie "ICE 4" tonen
    // i.p.v. de volledige rijtuigaanduiding.
    const m = trein.vereistSerie.match(/^([A-Z]{1,5}(?:\s\d+(?:\.\d+)?|\s[IVX]+)?)/);
    return m ? m[1] : trein.vereistSerie;
  }
  return null;
}

export function afgeleideTotaalKlasse(s: ParsedSamenstelling): string | null {
  const klassen = new Set<string>();
  for (const p of s.posities) {
    if (p.vereistCategorie !== "LOCOMOTIEF" && p.vereistKlasse) {
      klassen.add(p.vereistKlasse);
    }
  }
  if (klassen.size === 0) return null;
  return Array.from(klassen).sort().join("+");
}
