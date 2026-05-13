// Markplaats-titels-lookup als sluitstuk: als de officiële sites en
// hfkern.de niets opleveren, kijken we naar wat verkopers in hun
// titels schrijven. Hergebruikt de bestaande eBay-connector.

import type { Lookup, LookupResult } from "./base";
import { EbayConnector } from "@/lib/connectors/ebay";
import {
  detectMaatschappij,
  detectPrijsEUR,
  detectSchaal,
  detectTijdperk,
} from "./util";
import type { WishlistItem } from "@prisma/client";

export class EbayTitlesLookup implements Lookup {
  readonly bron = "ebay-titles";
  private ebay = new EbayConnector();

  isEnabled(): boolean {
    return this.ebay.isEnabled();
  }

  async lookup({
    artikelnummer,
    merk,
  }: {
    artikelnummer: string;
    merk?: string | null;
  }): Promise<LookupResult | null> {
    // We hergebruiken de wensenlijst-search; voeren een synthetische
    // WishlistItem-input in.
    const synthetic = {
      id: "lookup",
      userId: "lookup",
      artikelnummer,
      merk: merk ?? null,
      omschrijving: artikelnummer,
      maxPrijs: null,
      prioriteit: 0,
      zoektermen: null,
      actief: true,
      notities: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as WishlistItem;
    let hits;
    try {
      hits = await this.ebay.search(synthetic);
    } catch {
      return null;
    }
    if (hits.length === 0) return null;
    // Combineer titels van de top-5 om patronen op te pikken.
    const titels = hits.slice(0, 5).map((h) => h.titel).join(" \n ");
    const prijzen = hits
      .map((h) => h.prijs ?? null)
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b);
    const median =
      prijzen.length > 0
        ? prijzen[Math.floor(prijzen.length / 2)]
        : detectPrijsEUR(titels);

    return {
      bron: this.bron,
      url: hits[0].url,
      artikelnummer,
      merk: merk ?? null,
      maatschappij: detectMaatschappij(titels),
      schaal: detectSchaal(titels),
      tijdperk: detectTijdperk(titels),
      suggestiePrijs: median ?? null,
      beschrijving: hits[0].beschrijving ?? null,
    };
  }
}
