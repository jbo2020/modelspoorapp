import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseWishlistFile, buildWlAutoMapping } from "@/lib/wishlist-import";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof Blob)) return new NextResponse("Geen bestand", { status: 400 });
  const filename = (file as File).name ?? "upload.xlsx";
  const buf = await file.arrayBuffer();
  try {
    const parsed = await parseWishlistFile(buf, filename);
    return NextResponse.json({
      headers: parsed.headers,
      rows: parsed.rows,
      sampleRows: parsed.rows.slice(0, 5),
      rowCount: parsed.rows.length,
      autoMapping: buildWlAutoMapping(parsed.headers),
    });
  } catch (e) {
    return new NextResponse(
      "Bestand kon niet worden gelezen: " + (e as Error).message,
      { status: 400 },
    );
  }
}
