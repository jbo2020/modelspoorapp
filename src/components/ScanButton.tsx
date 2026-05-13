"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ScanReport = {
  perBron: Record<
    string,
    { gevonden: number; nieuw: number; overgeslagen?: boolean; fout?: string }
  >;
  totaalNieuw: number;
};

export default function ScanButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function scan() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const report = (await res.json()) as ScanReport;
      const lines = Object.entries(report.perBron).map(([b, r]) =>
        r.overgeslagen
          ? `${b}: niet geconfigureerd`
          : r.fout
          ? `${b}: fout — ${r.fout}`
          : `${b}: ${r.nieuw} nieuw (${r.gevonden} gevonden)`,
      );
      setMsg(
        `Klaar. ${report.totaalNieuw} nieuwe treffers. ` + lines.join(" · "),
      );
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-muted">{msg}</span>}
      <button className="btn-primary" onClick={scan} disabled={busy}>
        {busy ? "Bezig…" : "Scan nu"}
      </button>
    </div>
  );
}
