"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FIELDS,
  FIELD_LABEL,
  type Field,
} from "@/lib/excel-import";
import {
  CATEGORIES,
  CATEGORIE_LABEL,
  type Categorie,
} from "@/lib/types";

type ParsedSheet = {
  sheetName: string;
  guessedCategorie: Categorie;
  headers: string[];
  autoMapping: Record<string, Field | "">;
  sampleRows: Array<Record<string, string>>;
  rowCount: number;
  rows: Array<Record<string, string>>;
};

type SheetState = ParsedSheet & {
  enabled: boolean;
  categorie: Categorie;
  mapping: Record<string, Field | "">;
};

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<"upload" | "map" | "done">("upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetState[]>([]);
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
      const res = await fetch("/api/import/parse", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { sheets: ParsedSheet[] };
      setSheets(
        data.sheets.map((s) => ({
          ...s,
          enabled: true,
          categorie: s.guessedCategorie,
          mapping: s.autoMapping,
        }))
      );
      setStep("map");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onCommit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sheets: sheets.map((s) => ({
            sheetName: s.sheetName,
            categorie: s.categorie,
            enabled: s.enabled,
            mapping: s.mapping,
            rows: s.rows,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        created: number;
        skipped: number;
        errors: string[];
      };
      setResult(data);
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function updateSheet(i: number, patch: Partial<SheetState>) {
    setSheets((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function updateMapping(i: number, header: string, value: Field | "") {
    setSheets((s) =>
      s.map((x, idx) =>
        idx === i ? { ...x, mapping: { ...x.mapping, [header]: value } } : x
      )
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Excel-import
      </h1>
      <p className="text-sm text-muted mb-6">
        Upload je bestaande Excel. Elk tabblad wordt voorgesteld als een
        categorie; controleer en pas de kolomtoewijzing aan vóór de import.
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
          <button type="submit" className="btn-primary self-start" disabled={busy}>
            {busy ? "Inlezen…" : "Inlezen"}
          </button>
        </form>
      )}

      {step === "map" && (
        <div className="space-y-6">
          {sheets.map((s, i) => (
            <section key={s.sheetName} className="card p-4">
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) =>
                        updateSheet(i, { enabled: e.target.checked })
                      }
                    />
                    <span className="font-medium">Tabblad: {s.sheetName}</span>
                    <span className="text-muted">({s.rowCount} rijen)</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted">Categorie</label>
                  <select
                    className="input w-auto"
                    value={s.categorie}
                    onChange={(e) =>
                      updateSheet(i, { categorie: e.target.value as Categorie })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORIE_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted">
                      <th className="py-2 pr-3">Kolomkop in Excel</th>
                      <th className="py-2 pr-3">Veld in de app</th>
                      <th className="py-2">Voorbeeld</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.headers.map((h) => (
                      <tr key={h} className="border-t border-line">
                        <td className="py-2 pr-3 font-medium">{h}</td>
                        <td className="py-2 pr-3">
                          <select
                            className="input"
                            value={s.mapping[h] ?? ""}
                            onChange={(e) =>
                              updateMapping(i, h, e.target.value as Field | "")
                            }
                          >
                            <option value="">— negeer —</option>
                            {FIELDS.map((f) => (
                              <option key={f} value={f}>
                                {FIELD_LABEL[f]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 text-muted truncate max-w-xs">
                          {s.sampleRows
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
          ))}
          <div className="flex items-center gap-2">
            <button
              className="btn-primary"
              onClick={onCommit}
              disabled={busy || !sheets.some((s) => s.enabled)}
            >
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
            {result.created} items geïmporteerd. {result.skipped} rijen
            overgeslagen.
          </p>
          {result.errors.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer">
                {result.errors.length} fouten/waarschuwingen
              </summary>
              <ul className="list-disc pl-5 text-muted mt-2 space-y-1">
                {result.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => router.push("/")}>
              Naar collectie
            </button>
            <button
              className="btn"
              onClick={() => {
                setSheets([]);
                setResult(null);
                setStep("upload");
              }}
            >
              Nieuw importeren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
