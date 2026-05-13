import type { Ocr } from "./base";
import { AnthropicOcr } from "./anthropic";
import { StubOcr } from "./stub";

export function pickOcr(): Ocr {
  const candidates: Ocr[] = [new AnthropicOcr()];
  return candidates.find((c) => c.isEnabled()) ?? new StubOcr();
}

export type { Ocr, OcrResult } from "./base";
