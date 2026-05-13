// Lookup-adapters voor een artikelnummer (+ optioneel merk).
//
// De adapters geven elk een (partieel) LookupResult terug; de aggregator
// (`lookup/index.ts`) merget de resultaten met voorkeur voor de meest
// gestructureerde bron. Zie sectie 5 van het ontwerp: de fabrikant heeft
// voorrang, hfkern.de daarna (vooral voor UIC-rijtuignummers), markt-
// plaatsen als laatste.

export type LookupResult = {
  bron: string;            // "marklin" | "roco" | "hfkern" | "ebay-titles" | ...
  url?: string | null;     // canonical product-URL als beschikbaar
  merk?: string | null;
  artikelnummer?: string | null;
  typeAanduiding?: string | null;
  maatschappij?: string | null;
  schaal?: string | null;
  tijdperk?: string | null;
  wagennummer?: string | null;  // UIC-formaat als hfkern dat geeft
  suggestiePrijs?: number | null;
  beschrijving?: string | null;
};

export interface Lookup {
  bron: string;
  isEnabled(): boolean;
  /** Roept de bron aan; geeft null terug als er niets is gevonden. */
  lookup(input: { artikelnummer: string; merk?: string | null }): Promise<LookupResult | null>;
}
