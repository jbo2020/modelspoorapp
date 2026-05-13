import ExcelJS from "exceljs";
import { CATEGORIES, type Categorie } from "./types";

export const FIELDS = [
  "merk",
  "artikelnummer",
  "typeAanduiding",
  "maatschappij",
  "schaal",
  "tijdperk",
  "aanschafprijs",
  "huidigeWaarde",
  "aankoopdatum",
  "aantal",
  "set",
  "trein",
  "status",
  "notities",
  // detail
  "loknummer",
  "kopstaart",
  "soort",
  "wagennummer",
  "wagentype",
  "vasteTrein",
  "subcategorie",
  "aantalDelen",
  "decoderadres",
  "stroomtype",
] as const;
export type Field = (typeof FIELDS)[number];

export const FIELD_LABEL: Record<Field, string> = {
  merk: "Merk",
  artikelnummer: "Artikelnummer",
  typeAanduiding: "Type-aanduiding",
  maatschappij: "Maatschappij",
  schaal: "Schaal",
  tijdperk: "Tijdperk",
  aanschafprijs: "Aanschafprijs",
  huidigeWaarde: "Huidige waarde",
  aankoopdatum: "Aankoopdatum",
  aantal: "Aantal",
  set: "Set",
  trein: "Trein",
  status: "Status",
  notities: "Opmerkingen",
  loknummer: "Loknummer",
  kopstaart: "Kop-/staartdetail",
  soort: "Soort (personen)",
  wagennummer: "Wagennummer",
  wagentype: "Wagentype",
  vasteTrein: "Vaste trein",
  subcategorie: "Subcategorie (smal)",
  aantalDelen: "Aantal delen",
  decoderadres: "Decoderadres",
  stroomtype: "Stroomtype",
};

// Heuristiek voor het automatisch raden van veld bij een kolomkop.
const HEADER_HINTS: Array<[RegExp, Field]> = [
  [/^merk$/i, "merk"],
  [/(art|artikel)[ .-]?(nr|nummer|no)/i, "artikelnummer"],
  [/^type/i, "typeAanduiding"],
  [/^(maatsch|mij|vervoerder)/i, "maatschappij"],
  [/^schaal/i, "schaal"],
  [/^(tijdperk|epoche|epoch|era)/i, "tijdperk"],
  [/(aanschaf|aankoop)(prijs)?/i, "aanschafprijs"],
  [/(huidige|waarde|actuele)/i, "huidigeWaarde"],
  [/(aankoopdatum|datum|gekocht)/i, "aankoopdatum"],
  [/^aantal$/i, "aantal"],
  [/^set$/i, "set"],
  [/^trein$/i, "trein"],
  [/^status$/i, "status"],
  [/(opmerking|notitie|toelichting)/i, "notities"],
  [/^(lok|loc)[ .-]?(nr|nummer|nummero|no)?$/i, "loknummer"],
  [/(kopstaart|kop\/staart|kop-?staart|detail)/i, "kopstaart"],
  [/^soort$/i, "soort"],
  [/^(wagen|rijtuig)[ .-]?(nr|nummer|no)?$/i, "wagennummer"],
  [/^wagentype$/i, "wagentype"],
  [/^vaste[ -]?trein$/i, "vasteTrein"],
  [/^subcat/i, "subcategorie"],
  [/^aantal[ -]?delen$/i, "aantalDelen"],
  [/^decoder/i, "decoderadres"],
  [/^stroomtype$/i, "stroomtype"],
];

export function guessField(header: string): Field | "" {
  const h = header.trim();
  for (const [re, f] of HEADER_HINTS) if (re.test(h)) return f;
  return "";
}

export function guessCategorie(sheetName: string): Categorie {
  const s = sheetName.toLowerCase();
  if (/loc|tractie/.test(s)) return "LOCOMOTIEF";
  if (/personen|rijtuig/.test(s)) return "PERSONENRIJTUIG";
  if (/goederen|wagon|vracht/.test(s)) return "GOEDERENWAGON";
  if (/smal/.test(s)) return "SMALSPOOR";
  if (/treinstel|emu|icn/.test(s)) return "TREINSTEL";
  return "LOCOMOTIEF";
}

export type ParsedSheet = {
  sheetName: string;
  guessedCategorie: Categorie;
  headers: string[];
  rows: Array<Record<string, string>>;
};

function cellToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown; richText?: Array<{ text: string }> };
    if (typeof o.text === "string") return o.text.trim();
    if (Array.isArray(o.richText)) return o.richText.map((r) => r.text).join("").trim();
    if (o.result !== undefined) return cellToString(o.result);
  }
  return String(v).trim();
}

export async function parseWorkbook(buf: ArrayBuffer): Promise<ParsedSheet[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const out: ParsedSheet[] = [];
  wb.eachSheet((sheet) => {
    const sheetName = sheet.name;
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      const h = cellToString(cell.value);
      if (h) headers.push(h);
    });
    if (headers.length === 0) return;

    const rows: Array<Record<string, string>> = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj: Record<string, string> = {};
      let anyValue = false;
      headers.forEach((h, i) => {
        const v = cellToString(row.getCell(i + 1).value);
        obj[h] = v;
        if (v) anyValue = true;
      });
      if (anyValue) rows.push(obj);
    });
    if (rows.length === 0) return;

    out.push({
      sheetName,
      guessedCategorie: guessCategorie(sheetName),
      headers,
      rows,
    });
  });
  return out;
}

export function buildAutoMapping(headers: string[]): Record<string, Field | ""> {
  const map: Record<string, Field | ""> = {};
  for (const h of headers) map[h] = guessField(h);
  return map;
}

export function isCat(v: string): v is Categorie {
  return (CATEGORIES as readonly string[]).includes(v);
}
