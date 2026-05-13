import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Modelspoor Collectie",
  description: "Persoonlijk beheer van een Zwitserse modelspoorverzameling.",
  manifest: "/manifest.json",
  icons: [{ rel: "icon", url: "/icons/icon.svg", type: "image/svg+xml" }],
  appleWebApp: {
    capable: true,
    title: "Modelspoor",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#D0091F",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="nl">
      <body className="min-h-screen flex flex-col">
        {session?.user && <Nav email={session.user.email ?? ""} />}
        <main className="flex-1 w-full max-w-app mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-line py-4 text-xs text-muted text-center">
          Modelspoor Collectie · Fase 1
        </footer>
      </body>
    </html>
  );
}
