// Orchestrator voor de foto-herkenningsflow:
//   1) OCR op de doos-foto (Claude Vision of stub)
//   2) Lookup op het gevonden artikelnummer (Märklin/Roco/hfkern/eBay)
//   3) Aggregeer tot een voorstel-ItemFormValues
//
// De gebruiker bevestigt of corrigeert het voorstel in een normale
// ItemForm — OCR is nooit 100% betrouwbaar (zie risicosectie 7 van het
// ontwerp), dus "voorstellen, gebruiker bevestigt" is de regel.

import { pickOcr } from "./ocr";
import type { OcrResult } from "./ocr";
import { runLookups } from "./lookup";
import type { AggregatedLookup } from "./lookup";
import type { Categorie } from "./types";

export type FotoProposal = {
  ocr: OcrResult;
  lookup: AggregatedLookup | null;
  voorstel: {
    categorie: Categorie;
    merk: string;
    artikelnummer: string;
    typeAanduiding: string;
    maatschappij: string;
    schaal: string;
    tijdperk: string;
    wagennummer: string;
    huidigeWaarde: number | "";
    notities: string;
  };
};

function guessCategorie(s: {
  typeAanduiding?: string | null;
  ruweTekst?: string | null;
}): Categorie {
  const text = `${s.typeAanduiding ?? ""} ${s.ruweTekst ?? ""}`.toLowerCase();
  if (/\b(re |ae |be |bls |cargo|lok)/i.test(text)) return "LOCOMOTIEF";
  if (/\b(icn|flirt|rabe|rbde|tee rae)/i.test(text)) return "TREINSTEL";
  if (/\b(eurocity|ec |ic |intercity|ew i+|bpm|sleeper|couchette|panor)/i.test(text)) {
    return "PERSONENRIJTUIG";
  }
  if (/\b(tagnpps|sgns|container|ketel|silo|suiker|wagon)/i.test(text)) {
    return "GOEDERENWAGON";
  }
  if (/\bh0m\b|\brhb\b|\bfo\b|\bbrünig\b/i.test(text)) return "SMALSPOOR";
  return "LOCOMOTIEF";
}

function firstNonEmpty(...vs: Array<string | null | undefined>): string {
  for (const v of vs) if (v && v.trim()) return v.trim();
  return "";
}

export async function runFotoPipeline(
  buf: Buffer,
  mime: string,
): Promise<FotoProposal> {
  const ocr = await pickOcr().extract(buf, mime);

  let lookup: AggregatedLookup | null = null;
  if (ocr.artikelnummer) {
    lookup = await runLookups({
      artikelnummer: ocr.artikelnummer,
      merk: ocr.merk ?? null,
    });
  }

  const categorie = guessCategorie(ocr);
  return {
    ocr,
    lookup,
    voorstel: {
      categorie,
      merk: firstNonEmpty(lookup?.merk, ocr.merk),
      artikelnummer: firstNonEmpty(lookup?.artikelnummer, ocr.artikelnummer),
      typeAanduiding: firstNonEmpty(lookup?.typeAanduiding, ocr.typeAanduiding),
      maatschappij: firstNonEmpty(lookup?.maatschappij, ocr.maatschappij),
      schaal: firstNonEmpty(lookup?.schaal, ocr.schaal),
      tijdperk: firstNonEmpty(lookup?.tijdperk),
      wagennummer: firstNonEmpty(lookup?.wagennummer),
      huidigeWaarde: lookup?.suggestiePrijs ?? "",
      notities: [
        ocr.brongebruikt === "stub" ? null : `OCR via ${ocr.brongebruikt}.`,
        lookup ? `Bronnen: ${lookup.bronnen.join(", ")}.` : null,
        lookup?.url ? `Productpagina: ${lookup.url}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  };
}
