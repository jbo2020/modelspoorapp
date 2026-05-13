import { NextResponse } from "next/server";
import { publicVapidKey } from "@/lib/push";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ key: publicVapidKey() });
}
