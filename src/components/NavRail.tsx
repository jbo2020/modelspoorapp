"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICON_BASE = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconList() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...ICON_BASE}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}
function IconCamera() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...ICON_BASE}>
      <path d="M3 8h4l2-2h6l2 2h4v11H3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...ICON_BASE}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...ICON_BASE}>
      <polygon points="12 3 14.6 9.5 21.5 10 16.3 14.5 18 21 12 17.3 6 21 7.7 14.5 2.5 10 9.4 9.5" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...ICON_BASE}>
      <path d="M3 13l3-8h12l3 8" />
      <path d="M3 13v6h18v-6h-5l-2 2h-4l-2-2H3z" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...ICON_BASE}>
      <path d="M12 3v12" />
      <polyline points="7 8 12 3 17 8" />
      <path d="M3 17v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}
function IconCog() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...ICON_BASE}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.4a7 7 0 0 0 0-2.8l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2.4-1.4L14 3h-4l-.6 2.2a7 7 0 0 0-2.4 1.4l-2.4-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.8l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2.4 1.4L10 21h4l.6-2.2a7 7 0 0 0 2.4-1.4l2.4.9 2-3.4z" />
    </svg>
  );
}

const NAV = [
  { id: "collectie", label: "Collectie", href: "/", icon: <IconList /> },
  { id: "foto", label: "Foto", href: "/foto", icon: <IconCamera /> },
  { id: "samenstellingen", label: "Samenstellingen", href: "/samenstellingen", icon: <IconTarget /> },
  { id: "wensenlijst", label: "Wensenlijst", href: "/wensenlijst", icon: <IconStar /> },
  { id: "treffers", label: "Treffers", href: "/treffers", icon: <IconInbox /> },
  { id: "import", label: "Import", href: "/import", icon: <IconUpload /> },
  { id: "instellingen", label: "Instellingen", href: "/instellingen", icon: <IconCog /> },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/")
    return pathname === "/" || pathname.startsWith("/collectie");
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavRail() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((it) => {
        const on = isActive(it.href, pathname);
        return (
          <Link
            key={it.id}
            href={it.href}
            className={`flex items-center gap-2.5 py-2.5 pl-3.5 pr-3 -ml-3 text-[13px] transition-colors ${
              on
                ? "text-ink bg-white border-l-2 border-l-sbb font-medium"
                : "text-ink2 hover:text-ink border-l-2 border-l-transparent"
            }`}
          >
            <span className={on ? "text-ink" : "text-muted"}>{it.icon}</span>
            <span>{it.label}</span>
            {on && (
              <span aria-hidden className="ml-auto text-muted text-[10px]">
                ›
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
