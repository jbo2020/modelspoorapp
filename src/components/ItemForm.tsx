"use client";

import { useState } from "react";
import {
  CATEGORIES,
  CATEGORIE_LABEL,
  TIJDPERKEN,
  PERSONEN_SOORT,
  WAGEN_TYPE,
  SMALSPOOR_SUB,
  type Categorie,
} from "@/lib/types";

type Detail = {
  loknummer?: string | null;
  kopstaart?: string | null;
  soort?: string | null;
  wagennummer?: string | null;
  wagentype?: string | null;
  vasteTrein?: string | null;
  subcategorie?: string | null;
  aantalDelen?: number | null;
  decoderadres?: number | null;
  stroomtype?: string | null;
};

export type ItemFormValues = {
  categorie: Categorie;
  merk: string;
  artikelnummer?: string | null;
  typeAanduiding?: string | null;
  maatschappij?: string | null;
  schaal?: string | null;
  tijdperk?: string | null;
  aanschafprijs?: number | null;
  huidigeWaarde?: number | null;
  aankoopdatum?: string | null;
  aantal?: number | null;
  set?: boolean | null;
  trein?: string | null;
  status?: "IN_BEZIT" | "VERKOCHT";
  notities?: string | null;
} & Detail;

export default function ItemForm({
  action,
  initial,
  submitLabel,
}: {
  action: (fd: FormData) => void | Promise<void>;
  initial?: Partial<ItemFormValues>;
  submitLabel: string;
}) {
  const [cat, setCat] = useState<Categorie>(initial?.categorie ?? "LOCOMOTIEF");

  return (
    <form action={action} className="space-y-6">
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Categorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className={`chip cursor-pointer ring-line ${
                  cat === c
                    ? "bg-sbb text-white ring-sbb"
                    : "bg-white text-ink hover:bg-paper"
                }`}
              >
                <input
                  type="radio"
                  name="categorie"
                  value={c}
                  checked={cat === c}
                  onChange={() => setCat(c as Categorie)}
                  className="sr-only"
                />
                {CATEGORIE_LABEL[c as Categorie]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Merk *</label>
          <input
            name="merk"
            required
            className="input"
            defaultValue={initial?.merk ?? ""}
            placeholder="Märklin, Roco, Piko, Fleischmann, …"
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
        <div className="sm:col-span-2">
          <label className="label">Type-aanduiding</label>
          <input
            name="typeAanduiding"
            className="input"
            defaultValue={initial?.typeAanduiding ?? ""}
            placeholder="bv. Re 460, EW IV, Tagnpps"
          />
        </div>
        <div>
          <label className="label">Maatschappij</label>
          <input
            name="maatschappij"
            className="input"
            defaultValue={initial?.maatschappij ?? ""}
            placeholder="SBB, BLS, SOB, RhB, …"
          />
        </div>
        <div>
          <label className="label">Schaal</label>
          <input
            name="schaal"
            className="input"
            defaultValue={initial?.schaal ?? ""}
            placeholder="H0, N, H0m, …"
          />
        </div>
        <div>
          <label className="label">Tijdperk</label>
          <select
            name="tijdperk"
            className="input"
            defaultValue={initial?.tijdperk ?? ""}
          >
            <option value="">—</option>
            {TIJDPERKEN.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Trein</label>
          <input
            name="trein"
            className="input"
            defaultValue={initial?.trein ?? ""}
            placeholder="bv. EN Wiener Walzer, EC Raffaello"
          />
        </div>
      </div>

      {/* Categoriespecifiek */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {CATEGORIE_LABEL[cat]} — extra velden
        </h2>

        {cat === "LOCOMOTIEF" && (
          <>
            <div>
              <label className="label">Loknummer</label>
              <input
                name="loknummer"
                className="input"
                defaultValue={initial?.loknummer ?? ""}
              />
            </div>
            <div>
              <label className="label">Kop-/staartdetail</label>
              <input
                name="kopstaart"
                className="input"
                defaultValue={initial?.kopstaart ?? ""}
                placeholder="bv. Affoltern am Albis, TEE, Cargo"
              />
            </div>
          </>
        )}

        {cat === "PERSONENRIJTUIG" && (
          <>
            <div>
              <label className="label">Soort</label>
              <select
                name="soort"
                className="input"
                defaultValue={initial?.soort ?? ""}
              >
                <option value="">—</option>
                {PERSONEN_SOORT.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Wagennummer (UIC)</label>
              <input
                name="wagennummer"
                className="input"
                defaultValue={initial?.wagennummer ?? ""}
                placeholder="bv. 61 85 20-90 235-3"
              />
            </div>
          </>
        )}

        {cat === "GOEDERENWAGON" && (
          <>
            <div>
              <label className="label">Wagentype</label>
              <select
                name="wagentype"
                className="input"
                defaultValue={initial?.wagentype ?? ""}
              >
                <option value="">—</option>
                {WAGEN_TYPE.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Wagennummer</label>
              <input
                name="wagennummer"
                className="input"
                defaultValue={initial?.wagennummer ?? ""}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Vaste trein</label>
              <input
                name="vasteTrein"
                className="input"
                defaultValue={initial?.vasteTrein ?? ""}
                placeholder="indien gekoppeld aan vaste samenstelling"
              />
            </div>
          </>
        )}

        {cat === "SMALSPOOR" && (
          <>
            <div>
              <label className="label">Subcategorie</label>
              <select
                name="subcategorie"
                className="input"
                defaultValue={initial?.subcategorie ?? ""}
              >
                <option value="">—</option>
                {SMALSPOOR_SUB.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Loknummer</label>
              <input
                name="loknummer"
                className="input"
                defaultValue={initial?.loknummer ?? ""}
              />
            </div>
            <div>
              <label className="label">Kop-/staartdetail</label>
              <input
                name="kopstaart"
                className="input"
                defaultValue={initial?.kopstaart ?? ""}
              />
            </div>
            <div>
              <label className="label">Wagennummer</label>
              <input
                name="wagennummer"
                className="input"
                defaultValue={initial?.wagennummer ?? ""}
              />
            </div>
          </>
        )}

        {cat === "TREINSTEL" && (
          <>
            <div>
              <label className="label">Aantal delen</label>
              <input
                name="aantalDelen"
                type="number"
                min={1}
                className="input"
                defaultValue={initial?.aantalDelen ?? ""}
              />
            </div>
            <div>
              <label className="label">Decoderadres</label>
              <input
                name="decoderadres"
                type="number"
                min={0}
                className="input"
                defaultValue={initial?.decoderadres ?? ""}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Stroomtype</label>
              <input
                name="stroomtype"
                className="input"
                defaultValue={initial?.stroomtype ?? ""}
                placeholder="bv. DC, AC, Digitaal, Analoog"
              />
            </div>
          </>
        )}
      </div>

      <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Aanschafprijs (€)</label>
          <input
            name="aanschafprijs"
            type="number"
            step="0.01"
            min="0"
            className="input"
            defaultValue={initial?.aanschafprijs ?? ""}
          />
        </div>
        <div>
          <label className="label">Huidige waarde (€)</label>
          <input
            name="huidigeWaarde"
            type="number"
            step="0.01"
            min="0"
            className="input"
            defaultValue={initial?.huidigeWaarde ?? ""}
          />
        </div>
        <div>
          <label className="label">Aankoopdatum</label>
          <input
            name="aankoopdatum"
            type="date"
            className="input"
            defaultValue={initial?.aankoopdatum ?? ""}
          />
        </div>
        <div>
          <label className="label">Aantal</label>
          <input
            name="aantal"
            type="number"
            min={1}
            className="input"
            defaultValue={initial?.aantal ?? 1}
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="set"
              defaultChecked={!!initial?.set}
              className="rounded border-line"
            />
            Onderdeel van een set/rake
          </label>
        </div>
        <div>
          <label className="label">Status</label>
          <select
            name="status"
            className="input"
            defaultValue={initial?.status ?? "IN_BEZIT"}
          >
            <option value="IN_BEZIT">In bezit</option>
            <option value="VERKOCHT">Verkocht</option>
          </select>
        </div>
      </div>

      <div className="card p-4">
        <label className="label">Opmerkingen</label>
        <textarea
          name="notities"
          rows={3}
          className="input"
          defaultValue={initial?.notities ?? ""}
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
        <a href="/" className="btn">
          Annuleren
        </a>
      </div>
    </form>
  );
}
