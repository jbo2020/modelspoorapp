import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCat, type Field } from "@/lib/excel-import";
import { CATEGORIES, type Categorie } from "@/lib/types";

export const runtime = "nodejs";

type SheetPayload = {
  sheetName: string;
  categorie: Categorie;
  enabled: boolean;
  mapping: Record<string, Field | "">;
  rows: Array<Record<string, string>>;
};

type Body = { sheets: SheetPayload[] };

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

function toBool(s: string): boolean {
  const v = s.trim().toLowerCase();
  return v === "ja" || v === "yes" || v === "true" || v === "1" || v === "x";
}

function toDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const body = (await req.json()) as Body;
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const sheet of body.sheets) {
    if (!sheet.enabled) continue;
    if (!isCat(sheet.categorie)) {
      errors.push(`Onbekende categorie voor tabblad ${sheet.sheetName}`);
      continue;
    }
    for (const row of sheet.rows) {
      const get = (f: Field): string => {
        const header = Object.entries(sheet.mapping).find(
          ([, mapped]) => mapped === f
        )?.[0];
        return header ? (row[header] ?? "") : "";
      };

      const merk = get("merk").trim();
      if (!merk) {
        skipped++;
        continue;
      }

      try {
        const detailCreate: Record<string, unknown> = {};
        switch (sheet.categorie) {
          case "LOCOMOTIEF":
            detailCreate.loc = {
              create: {
                loknummer: get("loknummer") || null,
                kopstaart: get("kopstaart") || null,
              },
            };
            break;
          case "PERSONENRIJTUIG":
            detailCreate.personen = {
              create: {
                soort: get("soort") || null,
                wagennummer: get("wagennummer") || null,
              },
            };
            break;
          case "GOEDERENWAGON":
            detailCreate.goederen = {
              create: {
                wagentype: get("wagentype") || null,
                wagennummer: get("wagennummer") || null,
                vasteTrein: get("vasteTrein") || null,
              },
            };
            break;
          case "SMALSPOOR":
            detailCreate.smal = {
              create: {
                subcategorie: get("subcategorie") || null,
                loknummer: get("loknummer") || null,
                kopstaart: get("kopstaart") || null,
                wagennummer: get("wagennummer") || null,
              },
            };
            break;
          case "TREINSTEL":
            detailCreate.treinstel = {
              create: {
                aantalDelen: toInt(get("aantalDelen")),
                decoderadres: toInt(get("decoderadres")),
                stroomtype: get("stroomtype") || null,
              },
            };
            break;
        }

        await prisma.item.create({
          data: {
            userId,
            categorie: sheet.categorie,
            merk,
            artikelnummer: get("artikelnummer") || null,
            typeAanduiding: get("typeAanduiding") || null,
            maatschappij: get("maatschappij") || null,
            schaal: get("schaal") || null,
            tijdperk: get("tijdperk") || null,
            aanschafprijs: toNumber(get("aanschafprijs")),
            huidigeWaarde: toNumber(get("huidigeWaarde")),
            aankoopdatum: toDate(get("aankoopdatum")),
            aantal: toInt(get("aantal")) ?? 1,
            set: toBool(get("set")),
            trein: get("trein") || null,
            status:
              get("status").toUpperCase() === "VERKOCHT"
                ? "VERKOCHT"
                : "IN_BEZIT",
            notities: get("notities") || null,
            ...detailCreate,
          },
        });
        created++;
      } catch (e) {
        errors.push(
          `Tabblad ${sheet.sheetName}, rij met merk "${merk}": ${(e as Error).message}`
        );
      }
    }
  }

  return NextResponse.json({ created, skipped, errors, categories: CATEGORIES });
}
