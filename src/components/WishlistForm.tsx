"use client";

export type WishlistFormValues = {
  artikelnummer?: string | null;
  merk?: string | null;
  omschrijving?: string | null;
  maxPrijs?: number | null;
  prioriteit?: number | null;
  zoektermen?: string | null;
  actief?: boolean | null;
  notities?: string | null;
};

export default function WishlistForm({
  action,
  initial,
  submitLabel,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: Partial<WishlistFormValues>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Omschrijving *</label>
          <input
            name="omschrijving"
            required
            className="input"
            defaultValue={initial?.omschrijving ?? ""}
            placeholder="bv. Märklin Re 460 Cargo"
          />
        </div>
        <div>
          <label className="label">Merk</label>
          <input
            name="merk"
            className="input"
            defaultValue={initial?.merk ?? ""}
          />
        </div>
        <div>
          <label className="label">Artikelnummer</label>
          <input
            name="artikelnummer"
            className="input"
            defaultValue={initial?.artikelnummer ?? ""}
          />
        </div>
        <div>
          <label className="label">Maximumprijs (€)</label>
          <input
            name="maxPrijs"
            type="number"
            step="0.01"
            min="0"
            className="input"
            defaultValue={initial?.maxPrijs ?? ""}
          />
        </div>
        <div>
          <label className="label">Prioriteit (0–5)</label>
          <input
            name="prioriteit"
            type="number"
            min={0}
            max={5}
            className="input"
            defaultValue={initial?.prioriteit ?? 0}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Extra zoektermen (komma-gescheiden)</label>
          <input
            name="zoektermen"
            className="input"
            defaultValue={initial?.zoektermen ?? ""}
            placeholder="bv. Re 460, Lok 2000, Cargo"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="actief"
              defaultChecked={initial?.actief ?? true}
              className="rounded border-line"
            />
            Actief — meenemen in dagelijkse marktplaatsmonitoring
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Opmerkingen</label>
          <textarea
            name="notities"
            rows={3}
            className="input"
            defaultValue={initial?.notities ?? ""}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
        <a href="/wensenlijst" className="btn">
          Annuleren
        </a>
      </div>
    </form>
  );
}
