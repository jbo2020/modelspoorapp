"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: Array<{ href: string; label: string; icon: string; match: (p: string) => boolean }> = [
  { href: "/", label: "Collectie", icon: "📚", match: (p) => p === "/" || p.startsWith("/collectie") },
  { href: "/foto", label: "Foto", icon: "📷", match: (p) => p.startsWith("/foto") },
  { href: "/wensenlijst", label: "Wensen", icon: "★", match: (p) => p.startsWith("/wensenlijst") },
  { href: "/treffers", label: "Treffers", icon: "◎", match: (p) => p.startsWith("/treffers") },
  { href: "/instellingen", label: "Meer", icon: "⋯", match: (p) => p.startsWith("/instellingen") || p.startsWith("/import") },
];

export default function BottomNav() {
  const pathname = usePathname() || "/";
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-line grid grid-cols-5 text-[11px]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Hoofdnavigatie"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex flex-col items-center justify-center gap-0.5 h-16 transition-colors " +
              (active ? "text-sbb font-semibold" : "text-muted hover:text-ink")
            }
          >
            <span className="text-lg leading-none" aria-hidden>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
