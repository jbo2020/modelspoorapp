// bahn.hfkern.de-lookup. De site (Helmut Kern, hobbyproject) is een
// uitstekende secundaire bron voor Roco- en Märklin-modellen tot ca.
// 2005: per artikelnummer staan productieperiode, lengte over puffers,
// tijdperk en — voor rijtuigen — het echte UIC-rijtuignummer. Zie ook
// het ontwerpdocument §5; voor persoonlijk gebruik met respectvolle
// frequentie aanvaardbaar, voor doorgifte/commercie expliciet
// toestemming nodig.
//
// We doen geen volledige site-crawl. Per artikelnummer halen we één
// zoekresultaat-pagina op via een sitemap-achtige indexpagina, of een
// directe productpagina als die voorspelbaar is. Bij ontbreken van die
// twee paden valt deze lookup terug op een eenvoudige Google-style
// site-search via de SBB Cargo-pages (uitgeschakeld zonder
// HFKERN_SEARCH_URL).

import type { Lookup, LookupResult } from "./base";
import {
  detectMaatschappij,
  detectSchaal,
  detectTijdperk,
  detectUIC,
  fetchText,
  stripTags,
} from "./util";

export class HfkernLookup implements Lookup {
  readonly bron = "hfkern";

  isEnabled(): boolean {
    return !!process.env.HFKERN_SEARCH_URL || !!process.env.HFKERN_ENABLE;
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
    const tpl = process.env.HFKERN_SEARCH_URL;
    if (!tpl) return null;
    const url = tpl.replace("{nr}", encodeURIComponent(nr)).replace(
      "{merk}",
      encodeURIComponent(merk ?? ""),
    );
    const res = await fetchText(url).catch(() => null);
    if (!res?.ok) return null;
    const haystack = stripTags(res.body);
    if (!haystack.includes(nr)) return null;
    return {
      bron: this.bron,
      url: res.finalUrl,
      artikelnummer: nr,
      merk: merk ?? null,
      maatschappij: detectMaatschappij(haystack),
      schaal: detectSchaal(haystack),
      tijdperk: detectTijdperk(haystack),
      wagennummer: detectUIC(haystack),
    };
  }
}
