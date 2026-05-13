// bahn.hfkern.de-lookup. Helmut Kern's hobbyproject is een uitstekende
// secundaire bron voor Roco- en Märklin-modellen: per artikelnummer
// staan productieperiode, lengte over puffers, tijdperk en — voor
// rijtuigen — het echte UIC-rijtuignummer.
//
// We bevragen twee menu-indexen (één voor wagons, één voor locs) en
// volgen vanuit daar de detail-link voor het opgegeven artikelnummer.
// Bij ontbreken van een hit retourneert lookup() null.
//
// Auteursrechten: de data is werk van Helmut Kern. Voor persoonlijk
// gebruik met respectvolle frequentie aanvaardbaar (ontwerp §5).
// Schakel uit door HFKERN_DISABLE=1.

import type { Lookup, LookupResult } from "./base";
import {
  detectMaatschappij,
  detectSchaal,
  detectTijdperk,
  detectUIC,
  fetchText,
  pageTitle,
  stripTags,
} from "./util";

const ROCO_WAGEN_MENU = "http://www.bahn.hfkern.de/Roco_Wagen/Menue.html";
const ROCO_LOC_MENU = "http://www.bahn.hfkern.de/Roco/Menue.html";
const MARKLIN_WAGEN_MENU = "http://www.bahn.hfkern.de/Maerklin_Wagen/Menue.html";
const MARKLIN_LOC_MENU = "http://www.bahn.hfkern.de/Maerklin/Menue.html";

type MenuHit = { detailUrl: string; menuUrl: string };

// In-memory cache van menu-pagina-inhoud zodat we niet bij elke lookup
// de index opnieuw fetchen. TTL beperkt tot één proces-leven (oké voor
// een seed-script of de duur van een dev-server).
const MENU_CACHE = new Map<string, { fetchedAt: number; body: string }>();
const MENU_TTL_MS = 60 * 60 * 1000;

async function getMenu(url: string): Promise<string | null> {
  const cached = MENU_CACHE.get(url);
  if (cached && Date.now() - cached.fetchedAt < MENU_TTL_MS) {
    return cached.body;
  }
  const res = await fetchText(url).catch(() => null);
  if (!res?.ok) return null;
  MENU_CACHE.set(url, { fetchedAt: Date.now(), body: res.body });
  return res.body;
}

function vindDetailUrl(menuHtml: string, baseUrl: string, nr: string): string | null {
  // Menu's bevatten regels als:
  //   <a href="44531_a.html">44531</a>  Bpm 51 85 ...
  // We zoeken een link waarvan de inner-tekst óf de href het nummer
  // bevat (afhankelijk van Kern's stijl per sectie).
  const escaped = nr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const linkRe = new RegExp(
    `<a[^>]+href="([^"]+)"[^>]*>[^<]*?${escaped}[^<]*?</a>`,
    "i",
  );
  const m = menuHtml.match(linkRe);
  if (!m) return null;
  const href = m[1];
  if (href.startsWith("http")) return href;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

async function probeerBron(
  menuUrl: string,
  nr: string,
): Promise<MenuHit | null> {
  const menuHtml = await getMenu(menuUrl);
  if (!menuHtml) return null;
  const detailUrl = vindDetailUrl(menuHtml, menuUrl, nr);
  if (!detailUrl) return null;
  return { detailUrl, menuUrl };
}

function detectLengte(text: string): string | null {
  // Lengte over puffers in mm, bv "265 mm" of "267,5 mm"
  const m = text.match(/(\d{2,4}(?:[,.]\d{1,2})?\s*mm)\b/i);
  return m?.[1] ?? null;
}

export class HfkernLookup implements Lookup {
  readonly bron = "hfkern";

  isEnabled(): boolean {
    return process.env.HFKERN_DISABLE !== "1";
  }

  async lookup({
    artikelnummer,
    merk,
  }: {
    artikelnummer: string;
    merk?: string | null;
  }): Promise<LookupResult | null> {
    const nr = artikelnummer.replace(/\D/g, "");
    if (nr.length < 4 || nr.length > 6) return null;

    const isMarklin = /m(ä|ae)rklin|trix/i.test(merk ?? "");
    const probeerLijst = isMarklin
      ? [MARKLIN_WAGEN_MENU, MARKLIN_LOC_MENU]
      : [ROCO_WAGEN_MENU, ROCO_LOC_MENU, MARKLIN_WAGEN_MENU, MARKLIN_LOC_MENU];

    let hit: MenuHit | null = null;
    for (const m of probeerLijst) {
      hit = await probeerBron(m, nr);
      if (hit) break;
    }
    if (!hit) return null;

    const det = await fetchText(hit.detailUrl).catch(() => null);
    if (!det?.ok) return null;
    const titel = pageTitle(det.body);
    const platTekst = stripTags(det.body);

    return {
      bron: this.bron,
      url: hit.detailUrl,
      artikelnummer: nr,
      merk: merk ?? (isMarklin ? "Märklin" : "Roco"),
      typeAanduiding: titel?.replace(/\s*[|·–-].*$/, "").trim() || null,
      maatschappij: detectMaatschappij(platTekst),
      schaal: detectSchaal(platTekst) ?? "H0",
      tijdperk: detectTijdperk(platTekst),
      wagennummer: detectUIC(platTekst),
      beschrijving: detectLengte(platTekst),
    };
  }
}
