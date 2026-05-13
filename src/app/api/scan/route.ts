import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scanForUser } from "@/lib/scan";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function runScan(userId: string) {
  return scanForUser(userId);
}

// Door de gebruiker geïnitieerde scan vanuit de UI.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const report = await runScan(session.user.id);
  return NextResponse.json(report);
}

// Cron-trigger: dagelijks via /api/scan?cron_secret=… aan te roepen door
// een externe scheduler. Loopt voor alle gebruikers.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("cron_secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const users = await prisma.user.findMany({ select: { id: true } });
  const all: Record<string, unknown> = {};
  for (const u of users) {
    try {
      all[u.id] = await runScan(u.id);
    } catch (e) {
      all[u.id] = { fout: (e as Error).message };
    }
  }
  return NextResponse.json({ scanned: users.length, results: all });
}
