import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSerieImage } from "@/lib/series-images";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const serie = url.searchParams.get("serie") ?? "";
  if (!serie) return NextResponse.json({ serie: null, imageUrl: null });
  const img = await getSerieImage(serie);
  return NextResponse.json(img ?? { serie: null, imageUrl: null });
}
