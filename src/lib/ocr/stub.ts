import type { Ocr, OcrResult } from "./base";

// Fallback wanneer geen OCR-adapter is geconfigureerd. Geeft niets terug,
// zodat de UI doorgaat naar het lege bevestigingsscherm dat de gebruiker
// handmatig kan invullen.

export class StubOcr implements Ocr {
  isEnabled(): boolean {
    return true;
  }
  async extract(): Promise<OcrResult> {
    return { brongebruikt: "stub" };
  }
}
