// Vertical nav-rail layout — Modelspoor Redesign atelier-stijl.
// Linker rail (232px) met merk + nav + accountstatus, rechts de content.

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
    <div className="w-full min-h-screen grid grid-cols-1 sm:grid-cols-[232px_1fr]">
      {/* Nav rail */}
      <aside className="bg-white border-r border-line flex flex-col px-4 py-5 sm:sticky sm:top-0 sm:h-screen">
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-7 h-7 bg-sbb grid place-items-center text-white font-semibold text-sm leading-none">
            +
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">Modelspoor</div>
            <div className="eyebrow leading-tight">Collectie</div>
          </div>
        </div>

        <NavRail />

        <div className="mt-auto pt-5 border-t border-line">
          <div className="eyebrow mb-1.5">Aangemeld</div>
          <div className="text-xs text-ink2 truncate">{email}</div>
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
      <main className="flex flex-col min-h-screen min-w-0">
        <div className="px-6 sm:px-8 py-6 flex-1 min-w-0">{children}</div>
        <footer className="border-t border-line py-3 px-6 sm:px-8 text-[11px] text-muted">
          Modelspoor Collectie · persoonlijk beheer van Zwitsers materieel
        </footer>
      </main>
    </div>
  );
}

/** Page-header — uppercase eyebrow boven titel + optionele actions rechts. */
export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="-mx-6 sm:-mx-8 -mt-6 mb-6 px-6 sm:px-8 py-5 bg-white border-b border-line flex items-end justify-between gap-6 flex-wrap">
      <div>
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="text-2xl sm:text-[28px] font-medium leading-tight tracking-tight">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
