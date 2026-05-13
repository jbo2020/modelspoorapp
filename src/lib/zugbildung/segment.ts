// Segmenteer een Röschus-Zugbildungsplan-tekst in losse treinblokken.
//
// Elk blok eindigt op de regel "zurück zur Zugliste". De Bemerkungen
// die in die regel beginnen horen bij het blok ervoor. We strippen
// page-headers ("Reisezüge Schweiz YYYY ...") binnen elk blok zodat
// de LLM-prompt schoner is en goedkoper.

export type Block = {
  index: number;
  raw: string;
};

const PAGE_HEADER_RE =
  /^\s*Reisezüge Schweiz\s+\d{4}.*$/gm;

// De treinkop-regel in een Röschus-blok eindigt op de Fahrplan-kolomkoppen
// "Fahrplan an ab". Alles daarvoor in het blok is Bemerkungen-staart van
// de VORIGE trein (de Bemerkungen lopen door over de blok-scheiding heen).
const TREIN_KOP_LINE_RE = /Fahrplan\s+an\s+ab\s*$/;

function stripVorigeBemerkingen(raw: string): string {
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (TREIN_KOP_LINE_RE.test(lines[i])) {
      return lines.slice(i).join("\n");
    }
  }
  return raw;
}

function bevatTreinkop(raw: string): boolean {
  for (const line of raw.split("\n")) {
    if (TREIN_KOP_LINE_RE.test(line)) return true;
  }
  return false;
}

export function segmentZugbildung(volledigeTekst: string): Block[] {
  // Zoek "Zugliste"-marker als startpunt (markeert het begin van de
  // treinenlijst; alles ervoor is metadata, niet relevant voor extractie).
  const startMatch = volledigeTekst.match(/^Zugliste\b/m);
  const bodyStart = startMatch?.index ?? 0;
  const body = volledigeTekst.slice(bodyStart);

  // Split op de "zurück zur Zugliste"-marker. Het blok daarvóór is een
  // complete trein.
  const parts = body.split(/zurück zur Zugliste[^\n]*\n?/);
  // Laatste segment is meestal de staart na het laatste blok — vaak leeg
  // of een paginabreak; negeren.
  const blocks: Block[] = [];
  let outIdx = 0;
  for (let i = 0; i < parts.length - 1; i++) {
    let cleaned = parts[i]
      .replace(PAGE_HEADER_RE, "")
      .replace(/\n{3,}/g, "\n\n");
    cleaned = stripVorigeBemerkingen(cleaned).trim();
    if (cleaned.length < 40) continue;
    // Sla blokken over die geen geldige treinkop hebben (vaak blok 0:
    // de Zugliste-introtabel die geen "Fahrplan an ab" bevat).
    if (!bevatTreinkop(cleaned)) continue;
    blocks.push({ index: outIdx++, raw: cleaned });
  }
  return blocks;
}

/** Heuristiek: probeer treinnummer + route uit het blok te lezen
 *  zonder LLM, voor logging en sanity-checks. */
export function snelTreinnummerRaden(raw: string): string | null {
  // Patronen die we zien:
  //   "  4 Zürich HB – Frankfurt (Main) Hbf ..."
  //   "IC 707 Genève – Sankt Gallen"
  //   "D 421 „Lutetia" Frasne – Bern"
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z]{0,3}\s*\d+[A-Z]?)\s+[„"A-ZÄÖÜ]/);
    if (m) return m[1].trim().replace(/\s+/g, " ");
  }
  return null;
}
