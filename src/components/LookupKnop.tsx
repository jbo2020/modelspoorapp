"use client";

import { useState } from "react";

type LookupResult = {
  bron: string;
  bronnen?: string[];
  url?: string | null;
  merk?: string | null;
  artikelnummer?: string | null;
  typeAanduiding?: string | null;
  maatschappij?: string | null;
  schaal?: string | null;
  tijdperk?: string | null;
  wagennummer?: string | null;
  suggestiePrijs?: number | null;
  beschrijving?: string | null;
};

/** Knop in ItemForm die online opzoekt op basis van merk + artikelnummer
 *  en de gevonden velden in het formulier injecteert. Niets wordt
 *  automatisch opgeslagen — de gebruiker blijft baas. */
export default function LookupKnop({ formId }: { formId: string }) {
  const [busy, setBusy] = useState(false);
  const [bericht, setBericht] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  function leesVeld(name: string): string {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return "";
    const el = form.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    return el?.value ?? "";
  }

  function vulIn(name: string, waarde: string | null | undefined): boolean {
    if (waarde == null || waarde === "") return false;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return false;
    const el = form.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLSelectElement
      | null;
    if (!el) return false;
    if (el.value && el.value.length > 0) return false; // niet overschrijven
    el.value = waarde;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  async function zoek() {
    setBusy(true);
    setBericht(null);
    setResult(null);
    const merk = leesVeld("merk").trim();
    const artikelnummer = leesVeld("artikelnummer").trim();
    if (!artikelnummer) {
      setBericht("Vul eerst een artikelnummer in.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/items/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ merk, artikelnummer }),
      });
      const data = (await res.json()) as { ok: boolean; lookup?: LookupResult; fout?: string };
      if (!data.ok) {
        setBericht(data.fout ?? "Niets gevonden");
      } else if (data.lookup) {
        setResult(data.lookup);
      }
    } catch (e) {
      setBericht((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function pasToe() {
    if (!result) return;
    const veranderd: string[] = [];
    if (vulIn("merk", result.merk)) veranderd.push("merk");
    if (vulIn("typeAanduiding", result.typeAanduiding)) veranderd.push("type");
    if (vulIn("maatschappij", result.maatschappij)) veranderd.push("maatschappij");
    if (vulIn("schaal", result.schaal)) veranderd.push("schaal");
    if (vulIn("tijdperk", result.tijdperk)) veranderd.push("tijdperk");
    if (vulIn("wagennummer", result.wagennummer)) veranderd.push("wagennummer");
    if (vulIn("huidigeWaarde", result.suggestiePrijs?.toString())) veranderd.push("waarde");
    setBericht(
      veranderd.length === 0
        ? "Alle velden waren al ingevuld — niets overschreven."
        : `Ingevuld: ${veranderd.join(", ")}`,
    );
    setResult(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" className="btn" onClick={zoek} disabled={busy}>
          {busy ? "Zoeken…" : "Zoek online"}
        </button>
        {bericht && <span className="text-xs text-muted">{bericht}</span>}
      </div>
      {result && (
        <div className="card p-3 text-sm space-y-1 bg-paper border-sbb/30">
          <div className="font-medium">Voorstel — bronnen: {result.bronnen?.join(", ") ?? result.bron}</div>
          <ul className="text-xs text-muted">
            {result.merk && <li>Merk: {result.merk}</li>}
            {result.typeAanduiding && <li>Type: {result.typeAanduiding}</li>}
            {result.maatschappij && <li>Maatschappij: {result.maatschappij}</li>}
            {result.schaal && <li>Schaal: {result.schaal}</li>}
            {result.tijdperk && <li>Tijdperk: {result.tijdperk}</li>}
            {result.wagennummer && <li>UIC-nummer: {result.wagennummer}</li>}
            {result.suggestiePrijs && <li>Suggestieprijs: €{result.suggestiePrijs.toFixed(2)}</li>}
            {result.url && (
              <li>
                <a className="text-sbb hover:underline" href={result.url} target="_blank" rel="noreferrer">
                  bron-pagina
                </a>
              </li>
            )}
          </ul>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-primary text-xs" onClick={pasToe}>
              Toepassen op lege velden
            </button>
            <button type="button" className="btn text-xs" onClick={() => setResult(null)}>
              Negeer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
