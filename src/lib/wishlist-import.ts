import ExcelJS from "exceljs";

export const WL_FIELDS = [
  "omschrijving",
  "merk",
  "artikelnummer",
  "maxPrijs",
  "prioriteit",
  "zoektermen",
  "notities",
] as const;
export type WlField = (typeof WL_FIELDS)[number];

export const WL_LABEL: Record<WlField, string> = {
  omschrijving: "Omschrijving",
  merk: "Merk",
  artikelnummer: "Artikelnummer",
  maxPrijs: "Maximumprijs",
  prioriteit: "Prioriteit",
  zoektermen: "Zoektermen",
  notities: "Opmerkingen",
};

const HEADER_HINTS: Array<[RegExp, WlField]> = [
  [/^omschrijving|titel|beschrijving$/i, "omschrijving"],
  [/^merk$/i, "merk"],
  [/(art|artikel)[ .-]?(nr|nummer|no)/i, "artikelnummer"],
  [/(max(imum)?[ -]?prijs|prijs)/i, "maxPrijs"],
  [/(prio|prioriteit)/i, "prioriteit"],
  [/(zoekterm|keyword|trefwoord)/i, "zoektermen"],
  [/(opmerking|notitie)/i, "notities"],
];

export function guessWlField(header: string): WlField | "" {
  const h = header.trim();
  for (const [re, f] of HEADER_HINTS) if (re.test(h)) return f;
  return "";
}

function cellToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown };
    if (typeof o.text === "string") return o.text.trim();
    if (o.result !== undefined) return cellToString(o.result);
  }
  return String(v).trim();
}

export type ParsedWlSheet = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export async function parseWishlistFile(
  buf: ArrayBuffer,
  filename: string,
): Promise<ParsedWlSheet> {
  if (filename.toLowerCase().endsWith(".csv")) {
    return parseCSV(new TextDecoder("utf-8").decode(buf));
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const sheet = wb.worksheets[0];
  if (!sheet) return { headers: [], rows: [] };
  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    const h = cellToString(cell.value);
    if (h) headers.push(h);
  });
  const rows: Array<Record<string, string>> = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string> = {};
    let any = false;
    headers.forEach((h, i) => {
      const v = cellToString(row.getCell(i + 1).value);
      obj[h] = v;
      if (v) any = true;
    });
    if (any) rows.push(obj);
  });
  return { headers, rows };
}

function parseCSV(text: string): ParsedWlSheet {
  // Eenvoudige CSV-parser; ondersteunt ", " en \r\n, geen geneste quotes binnen velden buiten standaard.
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const split = (s: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQ) {
        if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === "," || c === ";") { out.push(cur); cur = ""; }
        else cur += c;
      }
    }
    out.push(cur);
    return out.map((v) => v.trim());
  };
  const headers = split(lines[0]);
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = split(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = vals[idx] ?? ""));
    if (Object.values(obj).some((v) => v)) rows.push(obj);
  }
  return { headers, rows };
}

export function buildWlAutoMapping(headers: string[]): Record<string, WlField | ""> {
  const m: Record<string, WlField | ""> = {};
  for (const h of headers) m[h] = guessWlField(h);
  return m;
}
