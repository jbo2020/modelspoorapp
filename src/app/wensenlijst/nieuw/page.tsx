import WishlistForm from "@/components/WishlistForm";
import { createWishlistAction } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export default function NieuweWensPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Nieuwe wens
      </h1>
      <p className="text-sm text-muted mb-6">
        Voeg een item toe waar je naar zoekt. Actieve regels worden
        meegenomen in de dagelijkse marktplaatsmonitoring.
      </p>
      <WishlistForm
        action={createWishlistAction}
        initial={{ actief: true, prioriteit: 0 }}
        submitLabel="Opslaan"
      />
    </div>
  );
}
