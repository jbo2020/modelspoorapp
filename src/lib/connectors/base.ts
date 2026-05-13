// Connector-framework voor marktplaatsmonitoring.
//
// Elke marktplaats heeft eigen toegangsregels (zie sectie 5 van het ontwerp):
//
//   - eBay: officiële API, gestructureerd.
//   - Catawiki: geen consumenten-API; RSS waar beschikbaar.
//   - Marktplaats / 2dehands: scrapen is verboden volgens hun AV — daarom
//     gebruiken we inkomende e-mailmeldingen vanuit hun eigen
//     "zoekopdracht-met-melding"-functie. De gebruiker maakt op de site
//     zelf de zoekopdracht aan; de mail komt binnen op een door de app
//     gemonitorde mailbox, en de app parseert die mail.
//
// Alle connectors implementeren dezelfde interface zodat de scan-runner
// niets weet van de verschillen.

import type { WishlistItem } from "@prisma/client";

export type RawHit = {
  externId: string;
  titel: string;
  url: string;
  prijs?: number | null;
  valuta?: string | null;
  thumbnailUrl?: string | null;
  beschrijving?: string | null;
  vondsttijdstip?: Date;
};

export interface Connector {
  bron: string;
  /**
   * Geeft aan of de connector geconfigureerd is (heeft env-vars/creds).
   * Een niet-geconfigureerde connector wordt overgeslagen tijdens scan.
   */
  isEnabled(): boolean;
  /**
   * Zoekt op een wensenlijst-item. Retourneert max ~25 ruwe treffers.
   */
  search(item: WishlistItem): Promise<RawHit[]>;
}

/**
 * Eenvoudige relevantie-check: matcht de wensenlijst-omschrijving / merk /
 * artikelnummer op de titel van een treffer. Voorkomt valse hits van te
 * brede zoektermen.
 */
export function looksRelevant(item: WishlistItem, hit: RawHit): boolean {
  const t = hit.titel.toLowerCase();
  if (item.artikelnummer && t.includes(item.artikelnummer.toLowerCase())) {
    return true;
  }
  const woorden = [
    item.omschrijving,
    item.merk,
    ...(item.zoektermen?.split(",") ?? []),
  ]
    .filter((w): w is string => !!w)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3);
  if (woorden.length === 0) return true;
  let match = 0;
  for (const w of woorden) if (t.includes(w)) match++;
  return match >= Math.min(2, Math.ceil(woorden.length / 2));
}

/**
 * Filtert treffers op maximumprijs als die is opgegeven.
 */
export function withinBudget(item: WishlistItem, hit: RawHit): boolean {
  if (item.maxPrijs == null) return true;
  if (hit.prijs == null) return true; // onbekende prijs niet afkappen
  return hit.prijs <= item.maxPrijs;
}

export function buildSearchQuery(item: WishlistItem): string {
  const parts: string[] = [];
  if (item.merk) parts.push(item.merk);
  if (item.artikelnummer) parts.push(item.artikelnummer);
  else if (item.omschrijving) parts.push(item.omschrijving);
  return parts.join(" ").trim();
}
