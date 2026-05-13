import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import ItemCard from "@/components/ItemCard";
import Filters from "@/components/Filters";
import type { Categorie } from "@/lib/types";
import { isCategorie } from "@/lib/types";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: string; merk?: string; maat?: string; tp?: string };
}) {
  const userId = await requireUserId();
  const q = (searchParams.q ?? "").trim();
  const cat = searchParams.cat;
  const merk = searchParams.merk;
  const maat = searchParams.maat;
  const tp = searchParams.tp;

  const where: Prisma.ItemWhereInput = { userId };
  if (cat && isCategorie(cat)) where.categorie = cat;
  if (merk) where.merk = merk;
  if (maat) where.maatschappij = maat;
  if (tp) where.tijdperk = tp;
  if (q) {
    where.OR = [
      { merk: { contains: q } },
      { typeAanduiding: { contains: q } },
      { artikelnummer: { contains: q } },
      { maatschappij: { contains: q } },
      { trein: { contains: q } },
      { notities: { contains: q } },
    ];
  }

  const [items, allMerken, allMaat] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: [{ categorie: "asc" }, { merk: "asc" }, { typeAanduiding: "asc" }],
      take: 500,
    }),
    prisma.item.findMany({
      where: { userId },
      distinct: ["merk"],
      select: { merk: true },
      orderBy: { merk: "asc" },
    }),
    prisma.item.findMany({
      where: { userId, maatschappij: { not: null } },
      distinct: ["maatschappij"],
      select: { maatschappij: true },
      orderBy: { maatschappij: "asc" },
    }),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <Filters
        merken={allMerken.map((m) => m.merk)}
        maatschappijen={allMaat.map((m) => m.maatschappij!).filter(Boolean)}
        totaal={items.length}
      />
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Collectie</h1>
            <p className="text-sm text-muted">
              Bladeren, zoeken en beheren van je modelspoorverzameling.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/import" className="btn" title="Excel importeren">
              <span aria-hidden>⇪</span>
              <span className="hidden sm:inline">Import</span>
            </Link>
            <Link href="/collectie/nieuw" className="btn-primary">
              <span aria-hidden>＋</span>
              <span className="hidden sm:inline">Nieuw item</span>
              <span className="sm:hidden">Nieuw</span>
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-muted">Nog geen items in de collectie.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/collectie/nieuw" className="btn-primary">
                Eerste item toevoegen
              </Link>
              <Link href="/import" className="btn">
                Excel importeren
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((it) => (
              <ItemCard
                key={it.id}
                id={it.id}
                categorie={it.categorie as Categorie}
                merk={it.merk}
                typeAanduiding={it.typeAanduiding}
                artikelnummer={it.artikelnummer}
                maatschappij={it.maatschappij}
                tijdperk={it.tijdperk}
                aantal={it.aantal}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
