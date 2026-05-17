#!/usr/bin/env python3
# Zet de Röschus zugbildung.sqlite om naar het DumpedType[]-JSON-formaat
# dat scripts/import-samenstellingen-json.ts idempotent inleest.
#
#   python3 scripts/roschus-to-json.py <pad/naar/zugbildung.sqlite> <out.json>
#
# Mapping:
#   compositions          -> Samenstellingstype  (signatuur "rb:<fingerprint>")
#   composition_wagons    -> SamenstellingPositie
#   services(+sc)         -> Treindienst
#   wagon_glyphs+legend   -> positie.opmerking (feature-omschrijvingen)

import json
import re
import sqlite3
import sys

LOCO_KINDS = re.compile(
    r"^(Re|Ae|Ee|Be|Bm|De|Ce|Eem|Bem|Tm|Em|Ge|HGe|Deh|Bre|Ce)\s?\d",
    re.I,
)
LOCO_EXTRA = {
    "BR103", "BR143/BR155", "BR243/BR250", "BB15000", "Ae6/8", "Ae8/8",
    "Ae4/7", "Ae4/4", "Ae3/6I", "Ae415", "Ae485", "Ae610", "Ae6/6",
}
TREINSTEL_KINDS = {
    "RAe", "RABe", "RABDe12/12", "RABDe8/16", "NPZ", "ICE", "TGV", "TGVR",
    "TGVZR", "VT11.5", "RGP", "MC76", "RBe4/4", "RBe540", "ABDe535",
    "ABDe4/8", "BDe4/4", "RBDe4/4", "RVT", "DPZ", "Mistral69", "Mistral56",
    "RAm", "DACH", "RABDe", "SGP", "VT", "AD4hES", "D4hET", "B4hET",
}
FREIGHT_KINDS = {
    "Hbiss-vv", "Hbiss", "Hbis", "Hbis-vv", "Hbiqss", "Ibpss-vv", "Gqss",
    "DDm", "B4Dd", "Bm(fac)",
}

# Zuggattung-glyph -> korte treincode (voor treinnummer-prefix)
ZUGGATTUNG = {
    "F06A": "EC", "F06B": "EN", "F06C": "IC", "F06D": "IR",
    "F06E": "RE", "F06F": "ICE", "F070": "CNL", "F071": "S",
    "F074": "CIS", "F084": "TGV", "F085": "D",
}


def categorie(kind: str | None, label: str) -> str:
    k = (kind or "").strip()
    lab = label or ""
    if k in TREINSTEL_KINDS or re.search(r"\b(RAe|RABe|RABDe|RBe|RBDe|NPZ|ICN|ICE|TGV|ETR|FLIRT|RAm|VT11)\b", lab):
        return "TREINSTEL"
    if k in FREIGHT_KINDS:
        return "GOEDERENWAGON"
    if k in LOCO_EXTRA or LOCO_KINDS.match(k) or LOCO_KINDS.match(lab.split(" ")[-1] if lab else ""):
        return "LOCOMOTIEF"
    return "PERSONENRIJTUIG"


def klasse(vehicle_type: str | None, label: str) -> str | None:
    src = f"{vehicle_type or ''} {label or ''}"
    # Strip romeinse cijfers en haakjes, kijk naar klasseletters
    letters = re.sub(r"[IVX/()0-9.\s-]", "", src).upper()
    heeftA = "A" in letters
    heeftB = "B" in letters
    if heeftA and heeftB:
        return "1/2"
    if heeftA:
        return "1"
    if heeftB:
        return "2"
    return None


def jaar_uit(year: str) -> int | None:
    m = re.match(r"(\d{4})", year or "")
    return int(m.group(1)) if m else None


def main() -> None:
    src, out = sys.argv[1], sys.argv[2]
    c = sqlite3.connect(src)
    c.row_factory = sqlite3.Row

    legend = {
        r["codepoint"]: r["description"]
        for r in c.execute("SELECT codepoint, description FROM icon_legend")
    }

    # Posities per compositie
    wagons: dict[int, list] = {}
    for r in c.execute(
        "SELECT composition_id, position, label, operator, vehicle_kind, "
        "vehicle_type, glyphs_hex FROM composition_wagons ORDER BY composition_id, position"
    ):
        feats = []
        if r["glyphs_hex"]:
            for cp in r["glyphs_hex"].split(","):
                d = legend.get(cp.strip())
                if d:
                    feats.append(d)
        wagons.setdefault(r["composition_id"], []).append(
            {
                "positie": r["position"],
                "vereistCategorie": categorie(r["vehicle_kind"], r["label"]),
                "vereistSerie": r["label"],
                "vereistKlasse": klasse(r["vehicle_type"], r["label"]),
                "vereistRijtuignummer": None,
                "opmerking": " · ".join(feats) if feats else None,
            }
        )

    # Treindiensten per compositie
    diensten: dict[int, list] = {}
    q = """
      SELECT sc.composition_id, s.year, s.train_number, s.category_text,
             s.category_glyph, s.name, s.origin, s.destination, s.notes
      FROM service_compositions sc
      JOIN services s USING (service_id)
    """
    for r in c.execute(q):
        cat = None
        if r["category_glyph"]:
            cat = ZUGGATTUNG.get((r["category_glyph"] or "").split(",")[0])
        if not cat and r["category_text"]:
            cat = r["category_text"]
        treinnr = f'{cat} {r["train_number"]}'.strip() if cat else r["train_number"]
        naam = (r["name"] or "").strip()
        rawnotes = re.sub(r"[-]", "", r["notes"] or "").strip(" -·\t\n")
        notities = ""
        if naam:
            notities = f'„{naam}"'
        if rawnotes:
            notities = (notities + " — " + rawnotes).strip(" —")
        diensten.setdefault(r["composition_id"], []).append(
            {
                "treinnummer": treinnr,
                "jaar": jaar_uit(r["year"]),
                "routeVan": r["origin"],
                "routeNaar": r["destination"],
                "dienstdagen": None,
                "maatschappij": None,
                "bron": f'Röschus Zugbildungsplan {r["year"]}',
                "notities": notities or None,
            }
        )

    payload = []
    for comp in c.execute(
        "SELECT composition_id, fingerprint, wagon_count, traction, "
        "signature_human FROM compositions"
    ):
        cid = comp["composition_id"]
        pos = wagons.get(cid, [])
        if not pos:
            continue
        lok = comp["traction"]
        if not lok:
            loco = next(
                (p for p in pos if p["vereistCategorie"] == "LOCOMOTIEF"), None
            )
            lok = loco["vereistSerie"] if loco else None
        klassen = sorted(
            {
                p["vereistKlasse"]
                for p in pos
                if p["vereistCategorie"] != "LOCOMOTIEF" and p["vereistKlasse"]
            }
        )
        # maatschappij afleiden uit eerste woord van de eerste positie
        eerste = pos[0]["vereistSerie"] or ""
        mij = eerste.split(" ")[0] if eerste else None
        for d in diensten.get(cid, []):
            d["maatschappij"] = mij
        payload.append(
            {
                "signatuur": f'rb:{comp["fingerprint"]}',
                "omschrijving": None,
                "aantalPosities": comp["wagon_count"],
                "lokSerie": lok,
                "totaalKlasse": "+".join(klassen) if klassen else None,
                "eersteBron": "Röschus Zugbildungsplan (DB-import)",
                "posities": pos,
                "treindiensten": diensten.get(cid, []),
            }
        )

    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    nd = sum(len(t["treindiensten"]) for t in payload)
    npos = sum(len(t["posities"]) for t in payload)
    print(
        f"{len(payload)} types, {nd} treindiensten, {npos} posities -> {out}"
    )


if __name__ == "__main__":
    main()
