import Link from "next/link";
import { signOut } from "@/lib/auth";

export default function Nav({ email }: { email: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="max-w-app mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-sbb">●</span>{" "}
          <span>Modelspoor Collectie</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-4 text-sm text-muted">
          <Link className="hover:text-ink" href="/">Collectie</Link>
          <Link className="hover:text-ink" href="/collectie/nieuw">Toevoegen</Link>
          <Link className="hover:text-ink" href="/import">Import</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-muted hidden sm:inline">{email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="btn text-sm" type="submit">Uitloggen</button>
          </form>
        </div>
      </div>
      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-line h-14 grid grid-cols-3 text-xs">
        <Link className="flex flex-col items-center justify-center gap-0.5" href="/">
          <span>📚</span>Collectie
        </Link>
        <Link className="flex flex-col items-center justify-center gap-0.5" href="/collectie/nieuw">
          <span>＋</span>Toevoegen
        </Link>
        <Link className="flex flex-col items-center justify-center gap-0.5" href="/import">
          <span>⤓</span>Import
        </Link>
      </nav>
    </header>
  );
}
