import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readPhoto } from "@/lib/foto-storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const photo = await readPhoto(params.id, session.user.id);
  if (!photo) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(photo.buf), {
    headers: {
      "Content-Type": photo.mime,
      "Cache-Control": "private, max-age=600",
    },
  });
}
