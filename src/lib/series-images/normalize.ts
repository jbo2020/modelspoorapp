// Serie-naam normaliseren tot een stabiele cache-key zoals "re-460".
// Twee serie-aanduidingen die voor Wikipedia gelijkwaardig zijn (bv
// "Re 460" en "Re460" en "SBB Re 460") moeten dezelfde cache-key krijgen.

export function normalizeSerieKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/^(sbb|cff|ffs|bls|sob|rhb|fo|fob|mob|öbb|db|sncf|ns)\s+/i, "")
    .replace(/[/\\.,]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Pak het hoofdtype uit een rijtuig-aanduiding, bv "ICE 4 Bpmdzf5812.0"
 *  → "ICE 4". Hierdoor delen alle ICE 4-rijtuigen één Wikipedia-foto. */
export function hoofdType(input: string): string {
  const m = input.match(/^([A-ZÄÖÜ]{2,5}\s+\d+(?:\.\d+)?(?:\s+[A-Z]{1,3}(?:\s+[IVX]+)?)?)/i);
  if (m) return m[1].trim();
  const eersteTwee = input.split(/\s+/, 2).join(" ");
  return eersteTwee || input;
}
