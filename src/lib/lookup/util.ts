// Kleine HTML-utility's voor de lookup-adapters. Bewust geen jsdom om
// de bundle klein te houden; voor onze gestructureerde meta-extractie
// volstaat regex-extractie op de relevante tags.

export async function fetchText(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; body: string; finalUrl: string }> {
  const res = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    ...init,
    headers: {
      "User-Agent":
        "ModelspoorCollectieApp/1.0 (persoonlijk gebruik; respectvol scrapen)",
      "Accept-Language": "nl,de;q=0.9,en;q=0.8",
      Accept: "text/html,application/xhtml+xml",
      ...(init?.headers ?? {}),
    },
  });
  const body = res.ok ? await res.text() : "";
  return { ok: res.ok, status: res.status, body, finalUrl: res.url };
}

export function ogMeta(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m?.[1] ?? null;
}

export function metaName(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m?.[1] ?? null;
}

export function pageTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return decodeEntities(m[1].trim().replace(/\s+/g, " "));
}

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  auml: "ä",
  ouml: "ö",
  uuml: "ü",
  Auml: "Ä",
  Ouml: "Ö",
  Uuml: "Ü",
  szlig: "ß",
  euro: "€",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    )
    .replace(/&([a-zA-Z]+);/g, (m, k) => ENTITY_MAP[k] ?? m);
}

export function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const KNOWN_MAATSCHAPPIJEN = [
  "SBB", "CFF", "FFS", "BLS", "SOB", "RhB", "MOB", "MThB", "RBS",
  "BT", "RM", "SZU", "GFM", "TPF", "Travys", "Thurbo", "RegionAlps",
  "DB", "ÖBB", "SNCF", "NS", "NMBS", "DSB",
];

const KNOWN_TIJDPERKEN = ["I", "II", "III", "IV", "IV/V", "V", "V/VI", "VI"];

export function detectMaatschappij(text: string): string | null {
  for (const m of KNOWN_MAATSCHAPPIJEN) {
    const re = new RegExp(`\\b${m}\\b`);
    if (re.test(text)) return m;
  }
  return null;
}

export function detectTijdperk(text: string): string | null {
  // Patronen als "Epoche V", "Tijdperk V/VI", "Era IV"
  const m = text.match(
    /\b(?:Epoche|Tijdperk|Era|Epoque)\s*([IVX]+(?:\/[IVX]+)?)\b/i,
  );
  if (m && KNOWN_TIJDPERKEN.includes(m[1])) return m[1];
  return null;
}

export function detectSchaal(text: string): string | null {
  // Patronen "Spur H0", "Schaal N", "Gauge H0m"
  const m = text.match(
    /\b(?:Spur|Schaal|Gauge|Maatstaf)\s*([A-Z0-9]{1,3}m?)\b/i,
  );
  return m?.[1] ?? null;
}

export function detectUIC(text: string): string | null {
  // 12-cijferig UIC met spaties of streepjes, bv. "61 85 20-90 235-3"
  const m = text.match(
    /\b(\d{2}\s\d{2}\s\d{2}[-\s]\d{2}\s\d{3}[-\s]\d)\b/,
  );
  return m?.[1] ?? null;
}

export function detectPrijsEUR(text: string): number | null {
  const m = text.match(/€\s*([\d.]+,\d{2})/);
  if (!m) return null;
  return parseFloat(m[1].replace(/\./g, "").replace(",", "."));
}
