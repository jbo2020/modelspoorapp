// TXT-parser voor samenstellingsbestanden. Formaat: zie
// docs/samenstellingen-format.md. De parser is permissief — onbekende
// metadata-sleutels leveren een waarschuwing, geen fout. Eén bestand
// = één ParsedSamenstelling.

import type { Categorie } from "@/lib/types";

export type ParsedPositie = {
  positie: number;
  vereistCategorie: Categorie;
  vereistSerie: string | null;
  vereistKlasse: string | null;
  vereistRijtuignummer: string | null;
  opmerking: string | null;
};

export type ParsedSamenstelling = {
  bestand: string;
  treinnummer: string;
  jaar: number | null;
  routeVan: string | null;
  routeNaar: string | null;
  dienstdagen: string | null;
  maatschappij: string | null;
  bron: string | null;
  omschrijving: string | null;
  notities: string | null;
  posities: ParsedPositie[];
  waarschuwingen: string[];
};

const META_ALIASES: Record<string, keyof ParsedSamenstelling> = {
  treinnummer: "treinnummer",
  jaar: "jaar",
  "route-van": "routeVan",
  "route-naar": "routeNaar",
  routevan: "routeVan",
  routenaar: "routeNaar",
  dienstdagen: "dienstdagen",
  maatschappij: "maatschappij",
  bron: "bron",
  omschrijving: "omschrijving",
  opmerking: "notities",
  notities: "notities",
};

function prefixToCategorie(prefix: string): Categorie {
  const p = prefix.toLowerCase();
  if (p === "loc") return "LOCOMOTIEF";
  if (p === "loc:s") return "SMALSPOOR";
  if (p === "pos" || p === "pos:p") return "PERSONENRIJTUIG";
  if (p === "pos:g") return "GOEDERENWAGON";
  if (p === "pos:s") return "SMALSPOOR";
  if (p === "pos:t") return "TREINSTEL";
  throw new Error(`Onbekende positie-prefix "${prefix}"`);
}

function normKlasse(raw: string | null): string | null {
  if (!raw) return null;
  return raw
    .replace(/\s+/g, "")
    .replace(/e\b/gi, "")
    .replace(/klasse/gi, "")
    .replace(/^([12])\/([12])$/, "$1/$2")
    .toLowerCase()
    .replace(/[^0-9/]/g, "") || null;
}

export function parseSamenstelling(
  bestand: string,
  inhoud: string,
): ParsedSamenstelling {
  const waarschuwingen: string[] = [];
  const result: ParsedSamenstelling = {
    bestand,
    treinnummer: "",
    jaar: null,
    routeVan: null,
    routeNaar: null,
    dienstdagen: null,
    maatschappij: null,
    bron: null,
    omschrijving: null,
    notities: null,
    posities: [],
    waarschuwingen,
  };

  let positieIndex = 0;
  for (const rawLine of inhoud.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // positie-regel?
    if (/^(loc|pos)(\s|:)/i.test(line) || /^(loc|pos)\s*\|/i.test(line)) {
      const segments = line.split("|").map((s) => s.trim());
      const prefix = segments[0]?.toLowerCase();
      if (!prefix) {
        waarschuwingen.push(`onleesbare positie-regel: "${line}"`);
        continue;
      }
      let categorie: Categorie;
      try {
        categorie = prefixToCategorie(prefix);
      } catch (e) {
        waarschuwingen.push(`${(e as Error).message} in "${line}"`);
        continue;
      }
      const serie = segments[1] || null;
      const klasse = normKlasse(segments[2] ?? null);
      const rijtuig = segments[3] || null;
      const op = segments.slice(4).filter(Boolean).join(" | ") || null;
      result.posities.push({
        positie: positieIndex++,
        vereistCategorie: categorie,
        vereistSerie: serie,
        vereistKlasse: klasse,
        vereistRijtuignummer: rijtuig,
        opmerking: op,
      });
      continue;
    }

    // metadata-regel?
    const m = line.match(/^([A-Za-zÄÖÜäöü-]+)\s*:\s*(.+)$/);
    if (!m) {
      waarschuwingen.push(`niet-herkende regel: "${line}"`);
      continue;
    }
    const sleutel = m[1].toLowerCase();
    const waarde = m[2].trim();
    const veld = META_ALIASES[sleutel];
    if (!veld) {
      waarschuwingen.push(`onbekend metadata-veld "${m[1]}"`);
      continue;
    }
    if (veld === "jaar") {
      const j = parseInt(waarde, 10);
      result.jaar = Number.isFinite(j) ? j : null;
    } else {
      (result as Record<string, unknown>)[veld] = waarde;
    }
  }

  if (!result.treinnummer) {
    waarschuwingen.push("geen Treinnummer gevonden");
  }
  if (result.posities.length === 0) {
    waarschuwingen.push("geen posities (loc/pos) gevonden");
  }

  return result;
}
