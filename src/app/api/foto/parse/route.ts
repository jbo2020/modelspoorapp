import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storePhoto } from "@/lib/foto-storage";
import { runFotoPipeline } from "@/lib/foto-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof Blob)) {
    return new NextResponse("Geen bestand", { status: 400 });
  }
  const mime = file.type || "image/jpeg";
  if (!ALLOWED.has(mime)) {
    return new NextResponse(`Type niet ondersteund: ${mime}`, { status: 400 });
  }
  const arrayBuf = await file.arrayBuffer();
  if (arrayBuf.byteLength === 0) {
    return new NextResponse("Lege upload", { status: 400 });
  }
  if (arrayBuf.byteLength > MAX_BYTES) {
    return new NextResponse("Te groot (max 15 MB)", { status: 413 });
  }
  const buf = Buffer.from(arrayBuf);

  const stored = await storePhoto(session.user.id, buf, mime);

  try {
    const result = await runFotoPipeline(buf, mime);
    return NextResponse.json({
      fotoId: stored.id,
      ocr: result.ocr,
      lookup: result.lookup,
      voorstel: result.voorstel,
    });
  } catch (e) {
    return NextResponse.json({
      fotoId: stored.id,
      ocr: { brongebruikt: "fout", ruweTekst: null },
      lookup: null,
      voorstel: {},
      fout: (e as Error).message,
    });
  }
}
