import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseWorkbook, buildAutoMapping } from "@/lib/excel-import";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof Blob)) {
    return new NextResponse("Geen bestand", { status: 400 });
  }
  const buf = await file.arrayBuffer();
  try {
    const sheets = await parseWorkbook(buf);
    const result = sheets.map((s) => ({
      sheetName: s.sheetName,
      guessedCategorie: s.guessedCategorie,
      headers: s.headers,
      autoMapping: buildAutoMapping(s.headers),
      sampleRows: s.rows.slice(0, 5),
      rowCount: s.rows.length,
      // ruwe rijen ook meegeven zodat de commit-stap niet opnieuw hoeft te parsen
      rows: s.rows,
    }));
    return NextResponse.json({ sheets: result });
  } catch (e) {
    return new NextResponse(
      "Excel kon niet worden gelezen: " + (e as Error).message,
      { status: 400 }
    );
  }
}
