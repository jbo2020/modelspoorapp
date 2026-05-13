# Modelspoor Collectie App

Persoonlijke beheerapplicatie voor een Zwitserse modelspoorverzameling
(SBB en gerelateerd materieel). Zie [`docs/ontwerp.md`](docs/ontwerp.md) voor
het volledige technisch ontwerp.

Deze repository implementeert **Fase 1 — Kerncollectie**:

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + SQLite (lokaal); in productie PostgreSQL
- Auth.js met credentials-provider (single-user, maar wel auth)
- Vijf categorieën met categoriespecifieke detailtabellen:
  Locomotief, Personenrijtuig, Goederenwagon, Smalspoor, Treinstel
- Handmatig toevoegen, bewerken en verwijderen
- Zoeken en filteren op categorie, merk, maatschappij, tijdperk
- Excel-import met automatische én handmatige kolomtoewijzing per tabblad
- Inline SVG-iconenset per type, tijdperk-kleurmarkers

## Aan de slag

```bash
cp .env.example .env
# pas SEED_USER_EMAIL/SEED_USER_PASSWORD en AUTH_SECRET aan
npm install
npm run db:push        # maakt SQLite-schema aan
npm run db:seed        # maakt eerste gebruiker + voorbeelditems
npm run dev
```

Open <http://localhost:3000>. Log in met de seed-credentials.

## Mappenstructuur

```
src/
  app/                 # Next.js App Router pagina's en API-routes
    page.tsx           # Collectieoverzicht (grid + filters)
    login/             # Aanmelden
    collectie/         # Detail, bewerken, nieuw
    import/            # Excel-import-flow
    api/               # auth + import endpoints
  components/          # UI: Nav, ItemCard, ItemForm, Filters, Icons, ...
  lib/                 # Prisma client, auth, types, server actions, import logica
prisma/
  schema.prisma        # datamodel
  seed.ts              # eerste gebruiker en demo-items
docs/
  ontwerp.md           # technisch ontwerpdocument
```

## Datamodel (kort)

Eén `Item`-tabel met de gemeenschappelijke basisvelden plus vijf
detailtabellen die via `itemId` koppelen — Prisma `LocomotiefDetail`,
`PersonenrijtuigDetail`, `GoederenwagonDetail`, `SmalspoorDetail`,
`TreinstelDetail`. Categorie is een string-veld (SQLite kent geen enums);
de geldige waarden zijn afgedwongen in `src/lib/types.ts` en in de Zod-
schema's in `src/lib/items.ts`.

## Volgende fases (nog niet geïmplementeerd)

- Fase 2: Wensenlijst + dagelijkse marktplaatsmonitoring (eBay API,
  e-mailmeldingen voor Marktplaats/2dehands).
- Fase 3: Foto-naar-artikelnummer (OCR + lookup tegen
  Märklin/Roco/hfkern.de).
- Fase 4-5: Treinsamenstellingen (Zugbildungspläne) extraheren en matchen
  tegen de collectie.
- Fase 6: PWA-polish, donker thema, dashboards.
