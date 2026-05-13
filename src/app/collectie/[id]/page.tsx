import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CategoryIcon } from "@/components/Icons";
import TijdperkBadge from "@/components/TijdperkBadge";
import { CATEGORIE_LABEL, type Categorie } from "@/lib/types";
import { deleteItemAction } from "@/lib/items";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function fmtEUR(v?: number | null) {
  if (v == null) return null;
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v);
}

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await requireUserId();
  const item = await prisma.item.findFirst({
    where: { id: params.id, userId },
    include: {
      loc: true,
      personen: true,
      goederen: true,
      smal: true,
      treinstel: true,
    },
  });
  if (!item) notFound();

  const cat = item.categorie as Categorie;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start gap-4 mb-6">
        <div className="text-ink/80">
          <CategoryIcon categorie={cat} size={36} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted">
            {CATEGORIE_LABEL[cat]}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {[item.merk, item.typeAanduiding].filter(Boolean).join(" — ")}
          </h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
            {item.maatschappij && (
              <span className="chip bg-paper text-muted ring-line">
                {item.maatschappij}
              </span>
            )}
            <TijdperkBadge tijdperk={item.tijdperk} />
            {item.status === "VERKOCHT" && (
              <span className="chip bg-sbb/10 text-sbb ring-sbb/30">Verkocht</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/collectie/${item.id}/bewerken`} className="btn">
            Bewerken
          </Link>
          <form
            action={async () => {
              "use server";
              await deleteItemAction(item.id);
            }}
          >
            <button className="btn text-sbb hover:bg-sbb/5">Verwijderen</button>
          </form>
        </div>
      </div>

      <section className="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <Field label="Merk" value={item.merk} />
        <Field label="Artikelnummer" value={item.artikelnummer} />
        <Field label="Type-aanduiding" value={item.typeAanduiding} />
        <Field label="Schaal" value={item.schaal} />
        <Field label="Aantal" value={item.aantal} />
        <Field label="Set" value={item.set ? "ja" : null} />
        <Field label="Trein" value={item.trein} />
      </section>

      {cat === "LOCOMOTIEF" && item.loc && (
        <section className="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Loknummer" value={item.loc.loknummer} />
          <Field label="Kop-/staartdetail" value={item.loc.kopstaart} />
        </section>
      )}
      {cat === "PERSONENRIJTUIG" && item.personen && (
        <section className="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Soort" value={item.personen.soort} />
          <Field label="Wagennummer (UIC)" value={item.personen.wagennummer} />
        </section>
      )}
      {cat === "GOEDERENWAGON" && item.goederen && (
        <section className="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Wagentype" value={item.goederen.wagentype} />
          <Field label="Wagennummer" value={item.goederen.wagennummer} />
          <Field label="Vaste trein" value={item.goederen.vasteTrein} />
        </section>
      )}
      {cat === "SMALSPOOR" && item.smal && (
        <section className="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Subcategorie" value={item.smal.subcategorie} />
          <Field label="Loknummer" value={item.smal.loknummer} />
          <Field label="Kop-/staartdetail" value={item.smal.kopstaart} />
          <Field label="Wagennummer" value={item.smal.wagennummer} />
        </section>
      )}
      {cat === "TREINSTEL" && item.treinstel && (
        <section className="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Aantal delen" value={item.treinstel.aantalDelen} />
          <Field label="Decoderadres" value={item.treinstel.decoderadres} />
          <Field label="Stroomtype" value={item.treinstel.stroomtype} />
        </section>
      )}

      <section className="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <Field label="Aanschafprijs" value={fmtEUR(item.aanschafprijs)} />
        <Field label="Huidige waarde" value={fmtEUR(item.huidigeWaarde)} />
        <Field
          label="Aankoopdatum"
          value={item.aankoopdatum?.toISOString().slice(0, 10)}
        />
      </section>

      {item.notities && (
        <section className="card p-4">
          <div className="label mb-2">Opmerkingen</div>
          <p className="text-sm whitespace-pre-wrap">{item.notities}</p>
        </section>
      )}
    </div>
  );
}
