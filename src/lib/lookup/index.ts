// Aggregator: roept de bronnen aan in vaste volgorde en merged hun
// resultaten. De volgorde komt uit §5 van het ontwerp: fabrikant eerst,
// dan hfkern.de als secundaire bron, marktplaats-titels als sluitstuk.
// Velden uit eerdere bronnen winnen van latere, behalve voor velden die
// de eerdere bron niet kon vinden.

import type { Lookup, LookupResult } from "./base";
import { MarklinLookup } from "./marklin";
import { RocoLookup } from "./roco";
import { HfkernLookup } from "./hfkern";
import { EbayTitlesLookup } from "./marketplaces";

export type AggregatedLookup = LookupResult & {
  bronnen: string[];
};

function allLookups(): Lookup[] {
  return [
    new MarklinLookup(),
    new RocoLookup(),
    new HfkernLookup(),
    new EbayTitlesLookup(),
  ];
}

function merge(into: Partial<LookupResult>, from: LookupResult): void {
  for (const [k, v] of Object.entries(from)) {
    if (v == null || v === "") continue;
    const key = k as keyof LookupResult;
    if (into[key] == null || into[key] === "") {
      (into[key] as unknown) = v;
    }
  }
}

export async function runLookups(input: {
  artikelnummer: string;
  merk?: string | null;
}): Promise<AggregatedLookup | null> {
  if (!input.artikelnummer) return null;
  const merged: Partial<LookupResult> = {};
  const bronnen: string[] = [];
  for (const l of allLookups()) {
    if (!l.isEnabled()) continue;
    try {
      const r = await l.lookup(input);
      if (r) {
        bronnen.push(l.bron);
        merge(merged, r);
      }
    } catch (e) {
      console.error(`lookup ${l.bron} fout: ${(e as Error).message}`);
    }
  }
  if (bronnen.length === 0) return null;
  return {
    bron: bronnen.join(","),
    bronnen,
    ...merged,
  };
}

export type { LookupResult } from "./base";
