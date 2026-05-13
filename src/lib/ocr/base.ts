// OCR voor doos-foto's. Het ontwerpdocument noemt twee paden:
//
//   - Cloud-OCR (Google Vision / AWS Textract) — degelijk maar levert
//     alleen platte tekst; merk en type moet je daarna zelf afleiden.
//   - Vision-LLM (Claude, GPT-4o) — duurder per call, maar interpreteert
//     het hele beeld en kan in één stap merk, type én artikelnummer
//     extraheren. Wint bij dozen met variabele layout.
//
// We kiezen het LLM-pad: gestructureerde JSON-output is wat we voor de
// vervolg-lookup nodig hebben. Adapter-interface hieronder.

export type OcrResult = {
  artikelnummer?: string | null;
  merk?: string | null;
  typeAanduiding?: string | null;
  maatschappij?: string | null;
  schaal?: string | null;
  ruweTekst?: string | null;
  confidence?: number | null;
  brongebruikt: string;
};

export interface Ocr {
  isEnabled(): boolean;
  extract(buf: Buffer, mime: string): Promise<OcrResult>;
}
