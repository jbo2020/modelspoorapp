import type { Categorie } from "@/lib/types";

type Props = { className?: string; size?: number };

function Base({
  children,
  className,
  size = 28,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 32"
      width={size * 2}
      height={size}
      className={className}
      stroke="currentColor"
      fill="none"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* rails */}
      <line x1="0" y1="30" x2="64" y2="30" />
      <line x1="0" y1="28" x2="64" y2="28" />
      {children}
    </svg>
  );
}

export function LocIcon(p: Props) {
  return (
    <Base {...p}>
      {/* elektrische loc met pantograaf */}
      <rect x="6" y="10" width="52" height="14" rx="2" />
      <rect x="10" y="14" width="6" height="6" />
      <rect x="48" y="14" width="6" height="6" />
      <line x1="32" y1="4" x2="32" y2="10" />
      <polyline points="20,4 32,7 44,4" />
    </Base>
  );
}

export function PersonenIcon(p: Props) {
  return (
    <Base {...p}>
      <rect x="2" y="10" width="60" height="14" rx="2" />
      <line x1="8" y1="14" x2="8" y2="20" />
      <line x1="16" y1="14" x2="16" y2="20" />
      <line x1="24" y1="14" x2="24" y2="20" />
      <line x1="32" y1="14" x2="32" y2="20" />
      <line x1="40" y1="14" x2="40" y2="20" />
      <line x1="48" y1="14" x2="48" y2="20" />
      <line x1="56" y1="14" x2="56" y2="20" />
    </Base>
  );
}

export function GoederenIcon(p: Props) {
  return (
    <Base {...p}>
      <rect x="4" y="12" width="56" height="12" rx="1" />
      <line x1="32" y1="12" x2="32" y2="24" />
    </Base>
  );
}

export function SmalspoorIcon(p: Props) {
  return (
    <Base {...p}>
      <rect x="10" y="12" width="44" height="12" rx="2" />
      <circle cx="18" cy="26" r="2" />
      <circle cx="46" cy="26" r="2" />
      <line x1="32" y1="6" x2="32" y2="12" />
    </Base>
  );
}

export function TreinstelIcon(p: Props) {
  return (
    <Base {...p}>
      <path d="M2 24 L2 14 Q2 10 6 10 L26 10 L30 14 L30 24 Z" />
      <path d="M34 24 L34 14 L58 14 Q62 14 62 18 L62 24 Z" />
      <line x1="8" y1="14" x2="8" y2="20" />
      <line x1="16" y1="14" x2="16" y2="20" />
      <line x1="24" y1="14" x2="24" y2="20" />
      <line x1="42" y1="14" x2="42" y2="20" />
      <line x1="50" y1="14" x2="50" y2="20" />
      <line x1="58" y1="14" x2="58" y2="20" />
    </Base>
  );
}

export function CategoryIcon({
  categorie,
  ...rest
}: Props & { categorie: Categorie }) {
  switch (categorie) {
    case "LOCOMOTIEF":
      return <LocIcon {...rest} />;
    case "PERSONENRIJTUIG":
      return <PersonenIcon {...rest} />;
    case "GOEDERENWAGON":
      return <GoederenIcon {...rest} />;
    case "SMALSPOOR":
      return <SmalspoorIcon {...rest} />;
    case "TREINSTEL":
      return <TreinstelIcon {...rest} />;
  }
}
