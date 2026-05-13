"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WL_FIELDS, WL_LABEL, type WlField } from "@/lib/wishlist-import";

type Parsed = {
  headers: string[];
  rows: Array<Record<string, string>>;
  sampleRows: Array<Record<string, string>>;
  rowCount: number;
  autoMapping: Record<string, WlField | "">;
};

export default function WishlistImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "map" | "done">("upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<Record<string, WlField | "">>({});
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/wishlist/parse", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Parsed;
      setParsed(data);
      setMapping(data.autoMapping);
      setStep("map");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onCommit() {
    if (!parsed) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/wishlist/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mapping, rows: parsed.rows }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Wensenlijst importeren
      </h1>
      <p className="text-sm text-muted mb-6">
        Excel of CSV met minimaal een kolom voor de omschrijving.
      </p>

      {error && (
        <div className="card p-3 mb-4 border-sbb/40 bg-sbb/5 text-sm text-sbbDim">
          {error}
        </div>
      )}

      {step === "upload" && (
        <form onSubmit={onUpload} className="card p-6 flex flex-col gap-4">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv"
            required
            className="block"
          />
          <button className="btn-primary self-start" disabled={busy}>
            {busy ? "Inlezen…" : "Inlezen"}
          </button>
        </form>
      )}

      {step === "map" && parsed && (
        <div className="space-y-4">
          <section className="card p-4">
            <div className="text-sm text-muted mb-3">
              {parsed.rowCount} rijen gevonden. Wijs kolommen toe aan velden.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-2 pr-3">Kolom</th>
                    <th className="py-2 pr-3">Veld</th>
                    <th className="py-2">Voorbeeld</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.headers.map((h) => (
                    <tr key={h} className="border-t border-line">
                      <td className="py-2 pr-3 font-medium">{h}</td>
                      <td className="py-2 pr-3">
                        <select
                          className="input"
                          value={mapping[h] ?? ""}
                          onChange={(e) =>
                            setMapping({ ...mapping, [h]: e.target.value as WlField | "" })
                          }
                        >
                          <option value="">— negeer —</option>
                          {WL_FIELDS.map((f) => (
                            <option key={f} value={f}>
                              {WL_LABEL[f]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 text-muted truncate max-w-xs">
                        {parsed.sampleRows
                          .map((r) => r[h])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={onCommit} disabled={busy}>
              {busy ? "Importeren…" : "Importeren"}
            </button>
            <button className="btn" onClick={() => setStep("upload")}>
              Ander bestand
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Klaar</h2>
          <p className="text-sm">
            {result.created} wensen toegevoegd. {result.skipped} rijen overgeslagen.
          </p>
          {result.errors.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer">
                {result.errors.length} fouten
              </summary>
              <ul className="list-disc pl-5 text-muted mt-2 space-y-1">
                {result.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
          <button className="btn-primary" onClick={() => router.push("/wensenlijst")}>
            Naar wensenlijst
          </button>
        </div>
      )}
    </div>
  );
}
