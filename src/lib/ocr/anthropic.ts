// Claude Vision-adapter. Vraagt het model om gestructureerde JSON terug
// te geven met de velden die we direct kunnen gebruiken voor de lookup.

import type { Ocr, OcrResult } from "./base";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_OCR_MODEL ?? "claude-sonnet-4-6";

const PROMPT = `Je krijgt een foto van een doos of label van een modeltrein.
Lees zorgvuldig zoveel mogelijk informatie uit en geef ALLEEN geldige JSON
terug met deze sleutels:

{
  "artikelnummer": string | null,
  "merk": "Märklin" | "Roco" | "Piko" | "Fleischmann" | "Brawa" | "Liliput" | "ESU" | "Trix" | "LGB" | string | null,
  "typeAanduiding": string | null,
  "maatschappij": "SBB" | "BLS" | "SOB" | "RhB" | "MOB" | string | null,
  "schaal": "H0" | "N" | "H0m" | "TT" | "0" | "G" | string | null,
  "ruweTekst": string
}

Regels:
- Artikelnummer is typisch 4–6 cijfers (Märklin/Trix), of "62xxx"/"73xxx"/"74xxx" (Roco), of "5xxxx" (Piko).
- Bij twijfel: laat het veld null.
- Geen toelichting, geen markdown, alleen het JSON-object.`;

function parseJson(s: string): Record<string, unknown> | null {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 && t.toLowerCase() !== "null" ? t : null;
}

export class AnthropicOcr implements Ocr {
  isEnabled(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async extract(buf: Buffer, mime: string): Promise<OcrResult> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY ontbreekt");
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mime,
                  data: buf.toString("base64"),
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Anthropic OCR ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const parsed = parseJson(text);
    if (!parsed) {
      return { brongebruikt: "anthropic-vision", ruweTekst: text };
    }
    return {
      artikelnummer: asString(parsed.artikelnummer),
      merk: asString(parsed.merk),
      typeAanduiding: asString(parsed.typeAanduiding),
      maatschappij: asString(parsed.maatschappij),
      schaal: asString(parsed.schaal),
      ruweTekst: asString(parsed.ruweTekst),
      brongebruikt: "anthropic-vision",
    };
  }
}
