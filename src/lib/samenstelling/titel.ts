// Trein-titel afleiden uit treinnummer + omschrijving/notities.
//   "EN 466" + omschrijving "Wiener Walzer NJ"     → "EuroNight Wiener Walzer"
//   "IC 707" + omschrijving "IC EW IV-stam ..."    → "IC 707"
//   "3" + geen omschrijving                         → "Trein 3"
//   "ICE 4" + geen omschrijving                     → "ICE 4"

const PREFIX: Record<string, string> = {
  EN: "EuroNight",
  IC: "InterCity",
  EC: "EuroCity",
  NJ: "Nightjet",
  ICE: "ICE",
  RJ: "Railjet",
  RE: "RegioExpress",
  IR: "InterRegio",
  IRE: "InterRegioExpress",
  S: "S-Bahn",
  R: "Regio",
  D: "D-Zug",
  TGV: "TGV",
  TER: "TER",
  CNL: "CityNightLine",
  ICN: "ICN",
};

type DienstLike = {
  treinnummer?: string | null;
  notities?: string | null;
} | null | undefined;

type TypeLike = {
  omschrijving?: string | null;
  lokSerie?: string | null;
} | null | undefined;

function pakBijnaam(...kandidaten: Array<string | null | undefined>): string | null {
  for (const k of kandidaten) {
    if (!k) continue;
    // Tussen aanhalingstekens (Duits „…", curly „…", recht "…")
    const m =
      k.match(/„([^"]+)"/) ||
      k.match(/„([^"]+)"/) ||
      k.match(/"([^"]+)"/);
    if (m) return m[1].trim();
  }
  // Fallback: omschrijving zonder veelvoorkomende suffix-codes
  for (const k of kandidaten) {
    if (!k) continue;
    const v = k
      .replace(/\b(NJ|EN|IC|EC|ICE|RJ|D-Zug|D|S)\b/g, "")
      .replace(/[—–-]\s*[A-ZÄÖÜa-zäöü]+stam/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (v && v.length >= 3 && v.length <= 50) return v;
  }
  return null;
}

export function treinTitel(d: DienstLike, t: TypeLike): string {
  const treinnr = (d?.treinnummer ?? "").trim();
  const m = treinnr.match(/^([A-Z]{1,4})\s*(\d+)?$/i);
  const prefix = m?.[1]?.toUpperCase() ?? "";
  const nummer = m?.[2] ?? "";
  const treintype = PREFIX[prefix] ?? prefix;

  const naam = pakBijnaam(t?.omschrijving, d?.notities);

  if (naam && treintype) return `${treintype} ${naam}`;
  if (naam) return naam;
  if (treintype && nummer) return `${treintype} ${nummer}`;
  if (treintype) return treintype;
  if (treinnr) return `Trein ${treinnr}`;
  return t?.lokSerie ?? "Samenstelling";
}
