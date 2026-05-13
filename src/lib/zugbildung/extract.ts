// LLM-extractie: stuur één treinblok naar Claude en krijg er
// gestructureerde data uit waarmee we een ParsedSamenstelling
// opbouwen.
//
// Hergebruikt het patroon uit src/lib/ocr/anthropic.ts: direct
// `messages` POST, JSON-prompt, en losse JSON-extractie uit het
// antwoord. Geen extra dependencies.

import type { ParsedSamenstelling, ParsedPositie } from "@/lib/samenstelling/parser";
import type { Categorie } from "@/lib/types";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_ZUG_MODEL ?? "claude-sonnet-4-6";

const PROMPT = `Hieronder staat een tekstblok uit een Zwitsers Zugbildungsplan
(Röschus Eisenbahninfos). Het blok beschrijft één trein: treinnummer,
route, fahrplan en de samenstelling van locomotief + rijtuigen.

Geef ALLEEN geldige JSON terug, exact dit schema:

{
  "treinnummer": string,
  "routeVan": string | null,
  "routeNaar": string | null,
  "dienstdagen": string | null,
  "maatschappij": string | null,
  "opmerking": string | null,
  "posities": [
    {
      "categorie": "LOCOMOTIEF" | "PERSONENRIJTUIG" | "GOEDERENWAGON" | "SMALSPOOR" | "TREINSTEL",
      "serie": string | null,
      "klasse": "1" | "2" | "1/2" | null,
      "rijtuignummer": string | null,
      "opmerking": string | null
    }
  ]
}

Regels:
- Het treinnummer staat aan het begin van het blok, vaak met treinsoort-prefix (D, IC, EC, EN, RE, S, ICE, TGV, NJ). Neem het complete nummer (bijvoorbeeld "IC 707", "EN 466", "ICE 4").
- routeVan / routeNaar zijn de eindstations uit de route-regel. Als de trein doorrijdt naar een verlenging tussen haakjes, kies dan het hoofd-eindpunt (zonder de haakjes).
- "posities" bevat ALLE wagons en de locomotief, in rijrichting. Wagon-aanduidingen verschijnen vaak meerdere keren in opeenvolgende kolomregels — dat zijn doorgaans HERHALINGEN voor de leesbaarheid, geen extra wagons. Neem elke unieke positie maar één keer op, in de volgorde van loc → eerste wagon → laatste wagon.
- "categorie": LOCOMOTIEF voor tractie (Re/Ae/Be/Eem/RBe/RBDe/HGe/Bem/HGm/Deh, BR, BR401-407, ICE, TGV, FLIRT-stuurstand als zelfstandige loc), TREINSTEL voor meerdelige stellen die als één eenheid rijden, anders PERSONENRIJTUIG (default). GOEDERENWAGON komt zelden voor in reizigerstreinen.
- "serie": de typische aanduiding zoals "Re 460", "Re 4/4 II", "EW IV B", "Bpmz 295", "ICE 4 Bpmz4812.0". Behoud zo veel mogelijk de originele schrijfwijze maar strip leading "SBB ", "DB ", "BLS ", enz.
- "klasse": "1" voor eerste klas, "2" voor tweede, "1/2" voor gemengd. Vaak afleidbaar uit de letter aan het begin van de wagon-serie (A=1e, B=2e, AB=1/2). null als onbekend.
- "rijtuignummer": het UIC-nummer als dat in het blok staat, anders null.
- "maatschappij": de uitvoerende vervoerder (SBB, BLS, DB, ÖBB, SNCF, NS, …). Vaak af te leiden uit "EVU:" of de loc-prefix.
- "dienstdagen": als er expliciet iets staat als "verkehrt nur an Werktagen" of "Mo-Fr" → samenvatten, anders null.
- "opmerking": korte samenvatting van bijzonderheden uit "Bemerkungen:" als die er zijn (max 1 zin), anders null.

Geen toelichting, geen markdown, alleen het JSON-object.

--- BLOK ---
`;

const VALID_CATS = new Set<Categorie>([
  "LOCOMOTIEF",
  "PERSONENRIJTUIG",
  "GOEDERENWAGON",
  "SMALSPOOR",
  "TREINSTEL",
]);

function pakJson(s: string): Record<string, unknown> | null {
  // Probeer eerst een eerste { ... } match; vaak heeft het model toch
  // wat toelichting voor of na de JSON gezet.
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function tekst(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.toLowerCase() === "null") return null;
  return t;
}

function asCategorie(v: unknown): Categorie {
  if (typeof v === "string" && VALID_CATS.has(v as Categorie)) {
    return v as Categorie;
  }
  return "PERSONENRIJTUIG";
}

export type ExtractieResultaat =
  | { ok: true; samenstelling: ParsedSamenstelling; ruwAntwoord: string }
  | { ok: false; fout: string; ruwAntwoord?: string };

export async function extraheerBlok(
  blok: string,
  jaar: number | null,
  bron: string,
  bestand: string,
): Promise<ExtractieResultaat> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { ok: false, fout: "ANTHROPIC_API_KEY ontbreekt" };
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: PROMPT + blok,
        },
      ],
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    return {
      ok: false,
      fout: `Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`,
    };
  }
  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const ruw = data.content?.find((c) => c.type === "text")?.text ?? "";
  const parsed = pakJson(ruw);
  if (!parsed) {
    return { ok: false, fout: "kon geen JSON uit antwoord halen", ruwAntwoord: ruw };
  }
  const treinnummer = tekst(parsed.treinnummer);
  if (!treinnummer) {
    return { ok: false, fout: "geen treinnummer", ruwAntwoord: ruw };
  }
  const posLijst = Array.isArray(parsed.posities) ? parsed.posities : [];
  const posities: ParsedPositie[] = posLijst.map((p, i) => {
    const row = (p ?? {}) as Record<string, unknown>;
    return {
      positie: i,
      vereistCategorie: asCategorie(row.categorie),
      vereistSerie: tekst(row.serie),
      vereistKlasse: tekst(row.klasse),
      vereistRijtuignummer: tekst(row.rijtuignummer),
      opmerking: tekst(row.opmerking),
    };
  });
  if (posities.length === 0) {
    return { ok: false, fout: "geen posities geretourneerd", ruwAntwoord: ruw };
  }
  const samenstelling: ParsedSamenstelling = {
    bestand,
    treinnummer,
    jaar,
    routeVan: tekst(parsed.routeVan),
    routeNaar: tekst(parsed.routeNaar),
    dienstdagen: tekst(parsed.dienstdagen),
    maatschappij: tekst(parsed.maatschappij),
    bron,
    omschrijving: null,
    notities: tekst(parsed.opmerking),
    posities,
    waarschuwingen: [],
  };
  return { ok: true, samenstelling, ruwAntwoord: ruw };
}
