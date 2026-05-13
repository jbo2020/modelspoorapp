import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Frame from "@/components/Frame";
import { auth } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

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
    <html lang="nl" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen flex bg-paper text-ink font-sans">
        {session?.user ? (
          <Frame email={session.user.email ?? ""}>{children}</Frame>
        ) : (
          <div className="flex-1">{children}</div>
        )}
      </body>
    </html>
  );
}
