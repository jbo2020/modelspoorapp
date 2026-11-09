// Beeldmerk: een M in de vorm van een stroomafnemer op een locdak, boven de rails.
// Zelfde ontwerp als public/icons/icon.svg (favicon en app iconen).

export function LogoMark({
  size = 32,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Geef een titel als het merk losstaat; zonder titel is het decoratief. */
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect width="100" height="100" rx="22" fill="#C5051C" />
      <rect x="24" y="20" width="52" height="6" rx="3" fill="#FAF8F5" />
      <path
        d="M33 66V31l17 21 17-21v35"
        fill="none"
        stroke="#FAF8F5"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="18" y="66" width="64" height="8" rx="2" fill="#FAF8F5" />
      <rect x="14" y="80" width="72" height="3" rx="1.5" fill="#FAF8F5" />
      <rect x="22" y="83" width="4" height="4" fill="#FAF8F5" />
      <rect x="38" y="83" width="4" height="4" fill="#FAF8F5" />
      <rect x="58" y="83" width="4" height="4" fill="#FAF8F5" />
      <rect x="74" y="83" width="4" height="4" fill="#FAF8F5" />
    </svg>
  );
}
