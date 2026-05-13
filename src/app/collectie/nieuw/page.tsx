import ItemForm from "@/components/ItemForm";
import { createItemAction } from "@/lib/items";

export const dynamic = "force-dynamic";

export default function NieuwPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Nieuw item
      </h1>
      <p className="text-sm text-muted mb-6">
        Voeg een nieuw model toe aan je collectie.
      </p>
      <ItemForm action={createItemAction} submitLabel="Opslaan" />
    </div>
  );
}
