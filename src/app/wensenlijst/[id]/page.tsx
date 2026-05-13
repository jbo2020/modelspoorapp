import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { deleteWishlistAction } from "@/lib/wishlist";
import TrefferRow from "@/components/TrefferRow";

export const dynamic = "force-dynamic";

function fmtEUR(v?: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v);
}

export default async function WensDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const wens = await prisma.wishlistItem.findFirst({
    where: { id: params.id, userId },
    include: {
      treffers: {
        orderBy: { vondsttijdstip: "desc" },
        take: 50,
      },
    },
  });
  if (!wens) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {wens.omschrijving}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs flex-wrap">
            {wens.merk && (
              <span className="chip bg-paper text-muted ring-line">{wens.merk}</span>
            )}
            {wens.artikelnummer && (
              <span className="chip bg-paper text-muted ring-line">
                art. {wens.artikelnummer}
              </span>
            )}
            <span className="chip bg-paper text-muted ring-line">
              max {fmtEUR(wens.maxPrijs)}
            </span>
            <span className="chip bg-paper text-muted ring-line">
              prio {wens.prioriteit}
            </span>
            {wens.actief ? (
              <span className="chip bg-sbb/10 text-sbb ring-sbb/30">Actief</span>
            ) : (
              <span className="chip bg-paper text-muted ring-line">Inactief</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/wensenlijst/${wens.id}/bewerken`} className="btn">
            Bewerken
          </Link>
          <form
            action={async () => {
              "use server";
              await deleteWishlistAction(wens.id);
            }}
          >
            <button className="btn text-sbb hover:bg-sbb/5">Verwijderen</button>
          </form>
        </div>
      </div>

      {wens.zoektermen && (
        <section className="card p-4 mb-4">
          <div className="label">Extra zoektermen</div>
          <div className="text-sm">{wens.zoektermen}</div>
        </section>
      )}

      {wens.notities && (
        <section className="card p-4 mb-4">
          <div className="label">Opmerkingen</div>
          <p className="text-sm whitespace-pre-wrap">{wens.notities}</p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">
          Treffers ({wens.treffers.length})
        </h2>
        {wens.treffers.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            Nog geen treffers voor deze wens.
          </div>
        ) : (
          <div className="card divide-y divide-line">
            {wens.treffers.map((t) => (
              <TrefferRow key={t.id} treffer={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
