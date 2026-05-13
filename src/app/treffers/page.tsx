import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import TrefferRow from "@/components/TrefferRow";
import ScanButton from "@/components/ScanButton";

export const dynamic = "force-dynamic";

export default async function TreffersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const userId = await requireUserId();
  const status = searchParams.status ?? "NIEUW";
  const [treffers, states, counts] = await Promise.all([
    prisma.marktplaatsTreffer.findMany({
      where: { userId, ...(status !== "ALLE" && { status }) },
      include: { wishlistItem: true },
      orderBy: { vondsttijdstip: "desc" },
      take: 100,
    }),
    prisma.connectorState.findMany({ where: { userId } }),
    prisma.marktplaatsTreffer.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(counts.map((c) => [c.status, c._count._all]));
  const filters = ["NIEUW", "GEZIEN", "GEKOCHT", "AFGEWEZEN", "ALLE"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Treffers</h1>
          <p className="text-sm text-muted">
            Gevonden aanbiedingen op je actieve wensenlijst-items.
          </p>
        </div>
        <ScanButton />
      </div>

      <div className="card p-3 mb-4 text-xs text-muted">
        {states.length === 0 ? (
          <span>Nog geen scans uitgevoerd.</span>
        ) : (
          states.map((s) => (
            <span key={s.bron} className="mr-4">
              <span className="font-medium text-ink">{s.bron}</span>:{" "}
              {s.laatsteScan
                ? `laatste scan ${s.laatsteScan.toLocaleString("nl-NL")}`
                : "—"}
              {s.laatsteFout && (
                <span className="text-sbb"> (fout: {s.laatsteFout})</span>
              )}
            </span>
          ))
        )}
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {filters.map((f) => {
          const c = f === "ALLE"
            ? Array.from(countMap.values()).reduce((a, b) => a + b, 0)
            : countMap.get(f) ?? 0;
          return (
            <Link
              key={f}
              href={`/treffers?status=${f}`}
              className={`chip ring-line ${
                status === f
                  ? "bg-ink text-white ring-ink"
                  : "bg-white text-muted hover:text-ink"
              }`}
            >
              {f.toLowerCase()} ({c})
            </Link>
          );
        })}
      </div>

      {treffers.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">
          Geen treffers in dit filter.
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {treffers.map((t) => (
            <TrefferRow key={t.id} treffer={t} />
          ))}
        </div>
      )}
    </div>
  );
}
