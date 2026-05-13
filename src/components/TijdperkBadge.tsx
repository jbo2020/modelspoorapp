// EraBadge v2 — pale era-tint background, monospaced label "EP <X>",
// vierkant in era-kleur ervoor. Mocht `large` waar zijn, iets groter.

const ERA_HEX: Record<string, { fg: string; bg: string }> = {
  I: { fg: "#6B4F2E", bg: "#EEDFC4" },
  II: { fg: "#8C6635", bg: "#EBD8B6" },
  III: { fg: "#B0823F", bg: "#EFD3A1" },
  IV: { fg: "#566C77", bg: "#D8DEE0" },
  V: { fg: "#345D77", bg: "#C8D5DE" },
  VI: { fg: "#1F4A66", bg: "#B8CADA" },
};

export default function TijdperkBadge({
  tijdperk,
  large,
}: {
  tijdperk?: string | null;
  large?: boolean;
}) {
  if (!tijdperk) return null;
  const first = tijdperk.split("/")[0];
  const tint = ERA_HEX[first] ?? { fg: "#7A7466", bg: "#E5DBC2" };
  return (
    <span
      className={`inline-flex items-center font-mono tracking-wider font-medium ${
        large ? "gap-1.5 px-2.5 py-1.5 text-[12px]" : "gap-1.5 px-1.5 py-1 text-[10.5px]"
      }`}
      style={{
        background: tint.bg,
        border: `1px solid ${tint.fg}55`,
        color: tint.fg,
        lineHeight: 1,
      }}
    >
      <span
        aria-hidden
        className="inline-block"
        style={{
          width: large ? 7 : 5,
          height: large ? 7 : 5,
          background: tint.fg,
        }}
      />
      EP&nbsp;{tijdperk}
    </span>
  );
}
