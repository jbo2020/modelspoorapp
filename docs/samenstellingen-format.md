# Formaat voor samenstellings-TXT-bestanden

Eén bestand per samenstelling. Tekst, UTF-8.

## Metadata bovenaan

Sleutel-waarde-regels, sleutel case-insensitief. De hieronder genoemde
sleutels zijn herkend; andere geven een waarschuwing maar breken de
import niet.

| Sleutel | Inhoud | Verplicht |
|---|---|---|
| `Treinnummer` | bv `IC 707`, `EN 466`, `S 12` | ✓ |
| `Jaar` | dienstregelingjaar, bv `2024` | aanbevolen |
| `Route-van` | beginstation | aanbevolen |
| `Route-naar` | eindstation | aanbevolen |
| `Dienstdagen` | bv `dagelijks`, `ma-vr`, `zon+feest` | optioneel |
| `Maatschappij` | bv `SBB`, `BLS`, `SOB`, `RhB` | aanbevolen |
| `Bron` | bv `Zugbildungsplan SBB 2024, p. 142` | optioneel |
| `Omschrijving` | korte naam voor het samenstellingstype, bv `IC EW IV-stam` | optioneel |
| `Opmerking` | vrije tekst | optioneel |

## Posities daaronder

Eén regel per positie. Eerst de locomotief (`loc`), daarna elk rijtuig
in rijrichting (`pos`). Veldscheider is `|`. Spaties rond velden worden
gestript; lege velden mogen.

```
loc | <serie> | <klasse> | <rijtuignummer> | <opmerking>
pos | <serie> | <klasse> | <rijtuignummer> | <opmerking>
```

Optioneel kun je per positie een expliciete categorie meegeven met een
suffix achter `pos`:

| Prefix | Categorie |
|---|---|
| `pos` of `pos:p` | `PERSONENRIJTUIG` (default) |
| `pos:g` | `GOEDERENWAGON` |
| `pos:s` | `SMALSPOOR` |
| `pos:t` | `TREINSTEL` (treinstel-deel) |
| `loc` | `LOCOMOTIEF` |
| `loc:s` | `SMALSPOOR` (smalspoor-loc) |

## Voorbeeld

```text
Treinnummer: IC 707
Jaar: 2024
Route-van: Genève
Route-naar: Sankt Gallen
Maatschappij: SBB
Bron: Zugbildungsplan SBB 2024, p. 142
Omschrijving: IC EW IV-stam Genève–SG

loc | Re 460 |     | 460 044-1 |
pos | EW IV A | 1e |           |
pos | EW IV B | 2e |           |
pos | EW IV B | 2e |           |
pos | EW IV B | 2e |           |
pos | EW IV B Bt | 2e |        | stuurstandrijtuig
```

## Ontdubbeling

Bestanden met **dezelfde rake** (loc-serie + dezelfde rijtuigseries en
klassen in dezelfde volgorde) krijgen automatisch hetzelfde
`Samenstellingstype` in de database. Het treinnummer en de jaargang
komen als afzonderlijke `Treindienst`-rij eronder. UIC-rijtuignummers
en opmerkingen tellen **niet** mee in de ontdubbeling — alleen serie,
klasse en volgorde.

Zo levert een binnenlandse IC die tien jaar dezelfde EW IV-rake heeft
één rij in `Samenstellingstype`, met tien `Treindienst`-rijen eronder.

## Laden

Plaats `.txt`-bestanden in `samenstellingen/` en draai:

```bash
npm run sam:load
```

Het script is idempotent: het herkent eerder ingelezen samenstellingen
op signatuur en voegt alleen nieuwe Treindiensten toe wanneer die nog
niet bestonden.
