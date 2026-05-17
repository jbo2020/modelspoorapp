// Wagen-feature-iconen — kleine lijntekeningen voor de symbool-iconen uit
// de Röschus-legenda (Speisewagen, Schlafwagen, Panoramawagen, ...).
// Input is de `opmerking`-tekst van een SamenstellingPositie: features
// gescheiden door " · ". Onbekende tekst valt terug op een tekst-chip.

const ICON: Record<
  string,
  { label: string; svg: React.ReactNode }
> = {};

const B = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function add(keys: string[], label: string, svg: React.ReactNode) {
  for (const k of keys) ICON[k] = { label, svg };
}

add(["Speisewagen / Restaurant", "Speisewagen"], "Restauratierijtuig",
  <svg viewBox="0 0 24 24" {...B}><path d="M7 3v8M9.5 3v8M7 11h2.5M8.25 11v10M16 3c-2 1-2 6 0 8v10" /></svg>);
add(["Bistro / Restaurant mit Selbstbedienung", "Bistro"], "Bistro / zelfbediening",
  <svg viewBox="0 0 24 24" {...B}><path d="M5 9h11a3 3 0 0 1 0 6h-1M5 9v5a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V9zM8 3v3M11 3v3" /></svg>);
add(["Barwagen"], "Barrijtuig",
  <svg viewBox="0 0 24 24" {...B}><path d="M5 4h14l-6 7v6M9 21h8M5 4l4 5" /></svg>);
add(["Schlafwagen"], "Slaaprijtuig",
  <svg viewBox="0 0 24 24" {...B}><path d="M3 18v-5h13a4 4 0 0 1 4 4v1M3 13V8M3 18h18M6.5 10.5h3" /></svg>);
add(["Liegewagen"], "Couchette",
  <svg viewBox="0 0 24 24" {...B}><path d="M3 8h18M3 14h18M3 8v10M21 8v10M3 12.5h18" /></svg>);
add(["Panoramawagen"], "Panoramarijtuig",
  <svg viewBox="0 0 24 24" {...B}><path d="M3 17V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8zM3 13h18" /></svg>);
add(["Rollstuhlabteil / Behindertengerecht", "Rollstuhlabteil"], "Rolstoeltoegankelijk",
  <svg viewBox="0 0 24 24" {...B}><circle cx="9" cy="4" r="1.6" /><path d="M9 7v6h5l3 5M9 10h4M5 12a5 5 0 0 0 6 8" /></svg>);
add(["Fahrradabteil"], "Fietsenafdeling",
  <svg viewBox="0 0 24 24" {...B}><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l4-7h5l3 7M9 7h3" /></svg>);
add(["Familienabteil"], "Familieafdeling",
  <svg viewBox="0 0 24 24" {...B}><circle cx="8" cy="6" r="2" /><circle cx="16" cy="6" r="2" /><path d="M5 20v-4a3 3 0 0 1 6 0v4M13 20v-4a3 3 0 0 1 6 0v4" /></svg>);
add(["direkte Wagen"], "Doorgaand rijtuig",
  <svg viewBox="0 0 24 24" {...B}><path d="M3 12h14M13 7l5 5-5 5M19 6v12" /></svg>);

export default function WagenFeatures({
  opmerking,
}: {
  opmerking?: string | null;
}) {
  if (!opmerking) return null;
  const delen = opmerking
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  if (delen.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
      {delen.map((d, i) => {
        const hit = ICON[d];
        if (hit) {
          return (
            <span
              key={i}
              title={hit.label}
              className="inline-flex items-center justify-center w-6 h-6 border border-line bg-paper2 text-ink2"
            >
              <span className="w-4 h-4 block">{hit.svg}</span>
            </span>
          );
        }
        return (
          <span key={i} className="chip-ghost text-[10px]" title={d}>
            {d}
          </span>
        );
      })}
    </div>
  );
}
