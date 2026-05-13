// Stabiele signatuur voor ontdubbeling van Samenstellingstypes.
//
// Volgens §4 en §6 van het ontwerp: dezelfde loc-serie, dezelfde
// rijtuig-series in dezelfde volgorde, dezelfde klassen → één type.
// UIC-rijtuignummers en opmerkingen blijven buiten de signatuur, want
// die zijn positie-niveau, niet type-niveau.
//
// Voor de pilot doen we letterlijke gelijkenis (na normalisatie van
// whitespace en hoofdletter); een normalisatietabel per rijtuigserie
// die kleine variaties als "Bpmz 295.1" vs "Bpmz 295" gelijk schakelt,
// is Fase 5-werk.

import type { ParsedPositie, ParsedSamenstelling } from "./parser";
import { createHash } from "node:crypto";

function normSerie(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "")
    .trim();
}

function normKlasse(k: string | null | undefined): string {
  return (k ?? "").toLowerCase().replace(/\s+/g, "");
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

export function berekenSignatuur(s: ParsedSamenstelling): string {
  const delen = s.posities.map(positieDeel).join("||");
  // korte hash voor sortering/uniqueness; volledige string in clear voor debug
  const hash = createHash("sha256").update(delen).digest("hex").slice(0, 16);
  return `${hash}::${delen}`;
}

export function afgeleideLokSerie(s: ParsedSamenstelling): string | null {
  const loc = s.posities.find((p) => p.vereistCategorie === "LOCOMOTIEF");
  return loc?.vereistSerie ?? null;
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
