import FotoFlow from "@/components/FotoFlow";
import { createItemAction } from "@/lib/items";

export const dynamic = "force-dynamic";

export default function FotoPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Foto-herkenning
      </h1>
      <p className="text-sm text-muted mb-6">
        Upload een foto van een doos of label; de app leest het
        artikelnummer en zoekt het op.
      </p>
      <FotoFlow createAction={createItemAction} />
    </div>
  );
}
