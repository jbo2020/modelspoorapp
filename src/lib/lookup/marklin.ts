// Märklin product-page lookup. De officiële site exposeert per
// artikelnummer een productpagina met voorspelbare URL:
//
//   https://www.maerklin.de/de/produkte/details/article/<nr>
//
// We halen <title> + OG-meta op en distilleren daar type/maatschappij/
// schaal/tijdperk uit met de detectie-utility's. Voor 4-cijferige
// nummers van Trix werkt het analoog via maerklin.de/trix → niet hier
// gedekt.

import type { Lookup, LookupResult } from "./base";
import {
  detectMaatschappij,
  detectSchaal,
  detectTijdperk,
  fetchText,
  ogMeta,
  pageTitle,
  stripTags,
} from "./util";

export class MarklinLookup implements Lookup {
  readonly bron = "marklin";
  isEnabled(): boolean {
    return true;
  }

  async lookup({
    artikelnummer,
    merk,
  }: {
    artikelnummer: string;
    merk?: string | null;
  }): Promise<LookupResult | null> {
    if (merk && !/m(ä|ae)rklin|trix/i.test(merk)) return null;
    const nr = artikelnummer.replace(/\D/g, "");
    if (nr.length < 4 || nr.length > 6) return null;

    const url = `https://www.maerklin.de/de/produkte/details/article/${nr}`;
    const res = await fetchText(url).catch(() => null);
    if (!res?.ok) return null;

    const title = pageTitle(res.body);
    const ogTitle = ogMeta(res.body, "title");
    const ogDescription = ogMeta(res.body, "description");
    const haystack = [title, ogTitle, ogDescription, stripTags(res.body).slice(0, 4000)]
      .filter((s): s is string => !!s)
      .join("\n");

    // Heuristiek: na "—" volgt typisch de productnaam.
    let typeAanduiding: string | null = null;
    if (ogTitle) {
      typeAanduiding = ogTitle.replace(/^Artikel\s*\d+\s*[–—-]\s*/i, "").trim();
    } else if (title) {
      typeAanduiding = title.replace(/\|.*$/, "").trim();
    }

    return {
      bron: this.bron,
      url,
      merk: "Märklin",
      artikelnummer: nr,
      typeAanduiding,
      maatschappij: detectMaatschappij(haystack),
      schaal: detectSchaal(haystack) ?? "H0",
      tijdperk: detectTijdperk(haystack),
      beschrijving: ogDescription ?? null,
    };
  }
}
