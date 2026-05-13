import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import WishlistForm from "@/components/WishlistForm";
import { updateWishlistAction } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export default async function BewerkWensPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await requireUserId();
  const wens = await prisma.wishlistItem.findFirst({
    where: { id: params.id, userId },
  });
  if (!wens) notFound();

  const action = async (fd: FormData) => {
    "use server";
    await updateWishlistAction(wens.id, fd);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Wens bewerken
      </h1>
      <p className="text-sm text-muted mb-6">Pas de zoekparameters aan.</p>
      <WishlistForm
        action={action}
        initial={{
          artikelnummer: wens.artikelnummer,
          merk: wens.merk,
          omschrijving: wens.omschrijving,
          maxPrijs: wens.maxPrijs,
          prioriteit: wens.prioriteit,
          zoektermen: wens.zoektermen,
          actief: wens.actief,
          notities: wens.notities,
        }}
        submitLabel="Wijzigingen opslaan"
      />
    </div>
  );
}
