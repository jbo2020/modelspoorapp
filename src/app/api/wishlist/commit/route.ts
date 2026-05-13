import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { WlField } from "@/lib/wishlist-import";

export const runtime = "nodejs";

type Body = {
  mapping: Record<string, WlField | "">;
  rows: Array<Record<string, string>>;
};

function toNumber(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[€\s]/g, "").replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
function toInt(s: string): number | null {
  const n = toNumber(s);
  return n == null ? null : Math.trunc(n);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const userId = session.user.id;
  const body = (await req.json()) as Body;

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of body.rows) {
    const get = (f: WlField): string => {
      const header = Object.entries(body.mapping).find(([, m]) => m === f)?.[0];
      return header ? (row[header] ?? "") : "";
    };
    const omschrijving = get("omschrijving").trim();
    if (!omschrijving) {
      skipped++;
      continue;
    }
    try {
      await prisma.wishlistItem.create({
        data: {
          userId,
          omschrijving,
          merk: get("merk") || null,
          artikelnummer: get("artikelnummer") || null,
          maxPrijs: toNumber(get("maxPrijs")),
          prioriteit: toInt(get("prioriteit")) ?? 0,
          zoektermen: get("zoektermen") || null,
          notities: get("notities") || null,
          actief: true,
        },
      });
      created++;
    } catch (e) {
      errors.push(`"${omschrijving}": ${(e as Error).message}`);
    }
  }
  return NextResponse.json({ created, skipped, errors });
}
