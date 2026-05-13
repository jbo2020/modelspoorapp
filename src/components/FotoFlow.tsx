"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ItemForm, { type ItemFormValues } from "@/components/ItemForm";
import type { Categorie } from "@/lib/types";

type ParseResponse = {
  fotoId: string;
  ocr: {
    artikelnummer?: string | null;
    merk?: string | null;
    typeAanduiding?: string | null;
    maatschappij?: string | null;
    schaal?: string | null;
    ruweTekst?: string | null;
    brongebruikt: string;
  };
  lookup: {
    bron?: string;
    bronnen?: string[];
    url?: string | null;
    typeAanduiding?: string | null;
    suggestiePrijs?: number | null;
  } | null;
  voorstel: Partial<ItemFormValues> & {
    categorie?: Categorie;
    huidigeWaarde?: number | "";
  };
  fout?: string;
};

export default function FotoFlow({
  createAction,
}: {
  createAction: (fd: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResponse | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/foto/parse", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      setResult((await res.json()) as ParseResponse);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!result) {
    return (
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <p className="text-sm text-muted">
          Maak of upload een foto van de doos of het label van een model.
          De app probeert het artikelnummer te lezen, zoekt het op bij de
          fabrikant en bij modelspoor-databases, en toont vervolgens een
          voorstel dat je kunt bevestigen of corrigeren.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          required
          className="block"
        />
        <button className="btn-primary self-start" disabled={busy}>
          {busy ? "Bezig met herkennen…" : "Lezen en opzoeken"}
        </button>
        {error && <p className="text-sm text-sbb">{error}</p>}
      </form>
    );
  }

  const v = result.voorstel ?? {};
  const initial: Partial<ItemFormValues> = {
    categorie: (v.categorie as Categorie) ?? "LOCOMOTIEF",
    merk: v.merk ?? "",
    artikelnummer: v.artikelnummer ?? "",
    typeAanduiding: v.typeAanduiding ?? "",
    maatschappij: v.maatschappij ?? "",
    schaal: v.schaal ?? "",
    tijdperk: v.tijdperk ?? "",
    huidigeWaarde:
      typeof v.huidigeWaarde === "number" ? v.huidigeWaarde : undefined,
    wagennummer: v.wagennummer ?? "",
    notities: v.notities ?? "",
    aantal: 1,
    status: "IN_BEZIT",
  };

  const ocrLines = [
    result.ocr.brongebruikt === "stub"
      ? "Geen OCR-adapter geconfigureerd (zet ANTHROPIC_API_KEY in .env)."
      : `OCR-bron: ${result.ocr.brongebruikt}.`,
    result.ocr.artikelnummer ? `Artikelnummer: ${result.ocr.artikelnummer}` : null,
    result.ocr.merk ? `Merk: ${result.ocr.merk}` : null,
    result.lookup ? `Lookup-bronnen: ${result.lookup.bronnen?.join(", ")}` : null,
    result.fout ? `Fout: ${result.fout}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <section className="card p-4 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
        <img
          src={`/api/foto/preview/${result.fotoId}`}
          alt="Geüploade foto"
          className="rounded-md border border-line max-h-48 w-full object-contain bg-paper"
        />
        <div>
          <h2 className="font-semibold mb-1">Voorstel ter bevestiging</h2>
          <p className="text-sm text-muted mb-2">
            Controleer en pas waar nodig aan. OCR is nooit volledig
            betrouwbaar — niets wordt opgeslagen tot je op opslaan klikt.
          </p>
          <ul className="text-xs text-muted space-y-0.5">
            {ocrLines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </section>

      <ItemForm
        action={createAction}
        initial={initial}
        submitLabel="Opslaan in collectie"
      />

      <div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setResult(null);
            router.refresh();
          }}
        >
          Andere foto proberen
        </button>
      </div>
    </div>
  );
}
