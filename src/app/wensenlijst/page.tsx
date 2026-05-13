import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { PageHeader } from "@/components/Frame";

export const dynamic = "force-dynamic";

function fmtEUR(v?: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(v);
}

export default async function WensenlijstPage() {
  const userId = await requireUserId();
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: [{ actief: "desc" }, { prioriteit: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { treffers: true } } },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Daily search"
        title="Wensenlijst"
        actions={
          <>
            <Link href="/wensenlijst/import" className="btn">
              Importeren
            </Link>
            <Link href="/wensenlijst/nieuw" className="btn-primary">
              Nieuw
            </Link>
          </>
        }
      />

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Nog niets op de wensenlijst.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/wensenlijst/nieuw" className="btn-primary">
              Eerste wens toevoegen
            </Link>
            <Link href="/wensenlijst/import" className="btn">
              Importeren uit Excel/CSV
            </Link>
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-3">Omschrijving</th>
                <th className="px-4 py-3">Merk</th>
                <th className="px-4 py-3">Art.nr.</th>
                <th className="px-4 py-3">Max prijs</th>
                <th className="px-4 py-3">Prio</th>
                <th className="px-4 py-3">Treffers</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-line last:border-0 hover:bg-paper"
                >
                  <td className="px-4 py-3">
                    <Link className="font-medium hover:text-sbb" href={`/wensenlijst/${w.id}`}>
                      {w.omschrijving ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{w.merk ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{w.artikelnummer ?? "—"}</td>
                  <td className="px-4 py-3">{fmtEUR(w.maxPrijs)}</td>
                  <td className="px-4 py-3">{w.prioriteit}</td>
                  <td className="px-4 py-3">{w._count.treffers}</td>
                  <td className="px-4 py-3">
                    {w.actief ? (
                      <span className="chip bg-sbb/10 text-sbb ring-sbb/30">
                        Actief
                      </span>
                    ) : (
                      <span className="chip bg-paper text-muted ring-line">
                        Inactief
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
