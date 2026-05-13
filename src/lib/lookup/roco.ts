// Roco product-page lookup. De catalogus heeft een zoek-endpoint dat
// per nummer naar de productpagina redirect; we volgen die en parsen
// titel + OG-meta. Voor Fleischmann werkt dezelfde host.

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

const ROCO_SEARCH = "https://www.roco.cc/nl/zoek?q=";
const FLEISCH_SEARCH = "https://www.fleischmann.de/nl/zoek?q=";

export class RocoLookup implements Lookup {
  readonly bron = "roco";
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
    const isRoco = !merk || /roco/i.test(merk);
    const isFleisch = !merk || /fleischmann/i.test(merk);
    if (!isRoco && !isFleisch) return null;
    const nr = artikelnummer.replace(/\D/g, "");
    if (nr.length < 4 || nr.length > 6) return null;

    const base = isFleisch && /fleischmann/i.test(merk ?? "")
      ? FLEISCH_SEARCH
      : ROCO_SEARCH;
    const url = base + encodeURIComponent(nr);
    const res = await fetchText(url).catch(() => null);
    if (!res?.ok) return null;

    const title = pageTitle(res.body);
    const ogTitle = ogMeta(res.body, "title");
    const ogDescription = ogMeta(res.body, "description");
    const haystack = [title, ogTitle, ogDescription, stripTags(res.body).slice(0, 4000)]
      .filter((s): s is string => !!s)
      .join("\n");

    const isLooksLikeProduct =
      /Art(?:ikel)?[. ]?Nr|artikelnummer/i.test(haystack) ||
      ogTitle?.toLowerCase().includes(nr);
    if (!isLooksLikeProduct) return null;

    return {
      bron: this.bron,
      url: res.finalUrl,
      merk: base === FLEISCH_SEARCH ? "Fleischmann" : "Roco",
      artikelnummer: nr,
      typeAanduiding: (ogTitle ?? title ?? "").replace(/\|.*$/, "").trim() || null,
      maatschappij: detectMaatschappij(haystack),
      schaal: detectSchaal(haystack) ?? (base === FLEISCH_SEARCH ? "N" : "H0"),
      tijdperk: detectTijdperk(haystack),
      beschrijving: ogDescription ?? null,
    };
  }
}
