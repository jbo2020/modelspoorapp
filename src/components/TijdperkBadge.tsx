// EraBadge — Modelspoor Redesign atelier-stijl: monospaced label "EP <X>"
// met een 6px vierkant in de era-kleur als prefix, dunne hairline border
// in dezelfde tint.

const ERA_HEX: Record<string, string> = {
  I: "#7B5E3A",
  II: "#9A7544",
  III: "#B58A57",
  IV: "#6E7E84",
  V: "#48708A",
  VI: "#2E5F7F",
};

export default function TijdperkBadge({
  tijdperk,
}: {
  tijdperk?: string | null;
}) {
  if (!tijdperk) return null;
  const first = tijdperk.split("/")[0];
  const color = ERA_HEX[first] ?? "#807A6F";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-mono tracking-wide bg-white"
      style={{
        border: `1px solid ${color}55`,
        color,
        lineHeight: 1,
      }}
    >
      <span
        aria-hidden
        className="inline-block w-1.5 h-1.5"
        style={{ background: color }}
      />
      EP {tijdperk}
    </span>
  );
}
