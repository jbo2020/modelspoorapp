"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import {
  CATEGORIES,
  CATEGORIE_LABEL,
  TIJDPERKEN,
  type Categorie,
} from "@/lib/types";

type Props = {
  merken: string[];
  maatschappijen: string[];
  totaal: number;
};

export default function Filters({ merken, maatschappijen, totaal }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");

  useEffect(() => setQ(sp.get("q") ?? ""), [sp]);

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== "") params.set(key, value);
    else params.delete(key);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      const current = sp.get("q") ?? "";
      if (q !== current) update("q", q || null);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const cat = sp.get("cat") ?? "";
  const merk = sp.get("merk") ?? "";
  const maat = sp.get("maat") ?? "";
  const tp = sp.get("tp") ?? "";

  return (
    <aside className="card p-4 space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div>
        <label className="label">Zoeken</label>
        <input
          className="input"
          placeholder="Merk, art.nr., type, trein, …"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Categorie</label>
        <select
          className="input"
          value={cat}
          onChange={(e) => update("cat", e.target.value || null)}
        >
          <option value="">Alle</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORIE_LABEL[c as Categorie]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Merk</label>
        <select
          className="input"
          value={merk}
          onChange={(e) => update("merk", e.target.value || null)}
        >
          <option value="">Alle</option>
          {merken.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Maatschappij</label>
        <select
          className="input"
          value={maat}
          onChange={(e) => update("maat", e.target.value || null)}
        >
          <option value="">Alle</option>
          {maatschappijen.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Tijdperk</label>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={`chip ring-line ${
              tp === "" ? "bg-ink text-white ring-ink" : "bg-white text-muted"
            }`}
            onClick={() => update("tp", null)}
          >
            Alle
          </button>
          {TIJDPERKEN.map((t) => (
            <button
              type="button"
              key={t}
              className={`chip ring-line ${
                tp === t ? "bg-ink text-white ring-ink" : "bg-white text-muted"
              }`}
              onClick={() => update("tp", t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted pt-2 border-t border-line">
        {totaal} {totaal === 1 ? "item" : "items"} gevonden
      </p>
    </aside>
  );
}
