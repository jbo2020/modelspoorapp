// Editorial Frame v2 — Swiss railway atelier.
// Linker rail (236px) met serif-wordmark "Modell­bahn" en collectie-eyebrow,
// page-header rechts met serif display-title (46px), eyebrow-rule en
// optionele lede-paragraaf. Subtiele paper-noise over de hele frame.

import { signOut } from "@/lib/auth";
import NavRail from "./NavRail";

export default function Frame({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="paper-noise relative w-full min-h-screen grid grid-cols-1 sm:grid-cols-[236px_1fr] bg-paper">
      {/* Nav rail — cream + serif wordmark */}
      <aside className="bg-paper border-r border-rule flex flex-col px-4 py-6 sm:sticky sm:top-0 sm:h-screen relative z-10">
        <div className="mb-8 pl-1">
          <div className="font-serif text-[26px] leading-tight text-ink">
            Modell&shy;bahn
          </div>
          <div className="eyebrow-rule mt-1.5">
            <span>Collectie</span>
            <span aria-hidden className="inline-block w-1 h-1 bg-sbb ml-1" />
          </div>
        </div>

        <NavRail />

        <div className="mt-auto pt-5 border-t border-rule">
          <div className="eyebrow mb-1.5">Aangemeld</div>
          <div className="text-xs text-ink2 truncate">{email}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted">
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full bg-accentGreen"
            />
            Sync · zojuist
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-3"
          >
            <button className="btn-ghost text-[11px]" type="submit">
              Uitloggen
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col min-h-screen min-w-0 relative z-10">
        <div className="px-6 sm:px-9 py-6 flex-1 min-w-0">{children}</div>
        <footer className="border-t border-rule py-3 px-6 sm:px-9 text-[11px] text-muted">
          Modelspoor Collectie · persoonlijk beheer van Zwitsers materieel
        </footer>
      </main>
    </div>
  );
}

/** Editorial page-header — eyebrow + serif display-title (46px) + lede. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  meta?: string;
}) {
  return (
    <header className="-mx-6 sm:-mx-9 -mt-6 mb-7 px-6 sm:px-9 py-7 bg-paper border-b border-rule flex items-start justify-between gap-6 flex-wrap relative">
      <div className="max-w-[60ch]">
        {eyebrow && <div className="eyebrow-rule mb-3">{eyebrow}</div>}
        <h1 className="font-serif text-[36px] sm:text-[46px] leading-[0.98] tracking-[-0.025em] text-ink font-normal">
          {title}
        </h1>
        {lede && (
          <p className="mt-3.5 text-[13px] text-ink2 leading-relaxed max-w-[60ch]">
            {lede}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-3">
        {meta && (
          <span className="font-mono text-[10px] tracking-wider text-muted tabular">
            {meta}
          </span>
        )}
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        )}
      </div>
    </header>
  );
}
