import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runLookups } from "@/lib/lookup";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const body = (await req.json()) as { merk?: string; artikelnummer?: string };
  const artikelnummer = (body.artikelnummer ?? "").trim();
  const merk = (body.merk ?? "").trim() || null;
  if (!artikelnummer) {
    return NextResponse.json({ ok: false, fout: "Geen artikelnummer opgegeven" });
  }
  try {
    const lookup = await runLookups({ artikelnummer, merk });
    if (!lookup) {
      return NextResponse.json({ ok: false, fout: "Geen treffer in adapters" });
    }
    return NextResponse.json({ ok: true, lookup });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      fout: (e as Error).message,
    });
  }
}
