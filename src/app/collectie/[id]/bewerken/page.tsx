import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { notFound } from "next/navigation";
import ItemForm, { type ItemFormValues } from "@/components/ItemForm";
import { updateItemAction } from "@/lib/items";
import type { Categorie } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BewerkPage({
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

  const initial: Partial<ItemFormValues> = {
    categorie: item.categorie as Categorie,
    merk: item.merk,
    artikelnummer: item.artikelnummer,
    typeAanduiding: item.typeAanduiding,
    maatschappij: item.maatschappij,
    schaal: item.schaal,
    tijdperk: item.tijdperk,
    aanschafprijs: item.aanschafprijs,
    huidigeWaarde: item.huidigeWaarde,
    aankoopdatum: item.aankoopdatum?.toISOString().slice(0, 10) ?? null,
    aantal: item.aantal,
    set: item.set,
    trein: item.trein,
    status: item.status as "IN_BEZIT" | "VERKOCHT",
    notities: item.notities,
    loknummer: item.loc?.loknummer ?? item.smal?.loknummer ?? null,
    kopstaart: item.loc?.kopstaart ?? item.smal?.kopstaart ?? null,
    soort: item.personen?.soort ?? null,
    wagennummer:
      item.personen?.wagennummer ??
      item.goederen?.wagennummer ??
      item.smal?.wagennummer ??
      null,
    wagentype: item.goederen?.wagentype ?? null,
    vasteTrein: item.goederen?.vasteTrein ?? null,
    subcategorie: item.smal?.subcategorie ?? null,
    aantalDelen: item.treinstel?.aantalDelen ?? null,
    decoderadres: item.treinstel?.decoderadres ?? null,
    stroomtype: item.treinstel?.stroomtype ?? null,
  };

  const action = async (fd: FormData) => {
    "use server";
    await updateItemAction(item.id, fd);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Item bewerken
      </h1>
      <p className="text-sm text-muted mb-6">
        Pas de gegevens van dit model aan.
      </p>
      <ItemForm action={action} initial={initial} submitLabel="Wijzigingen opslaan" />
    </div>
  );
}
