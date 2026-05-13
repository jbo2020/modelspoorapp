# Modelspoor Collectie App

Persoonlijke beheerapplicatie voor een Zwitserse modelspoorverzameling
(SBB en gerelateerd materieel). Zie [`docs/ontwerp.md`](docs/ontwerp.md) voor
het volledige technisch ontwerp.

Deze repository implementeert **Fase 1 — Kerncollectie**,
**Fase 2 — Wensenlijst + eerste monitoring** en
**Fase 3 — Foto-herkenning**:

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + SQLite (lokaal); in productie PostgreSQL
- Auth.js met credentials-provider (single-user, maar wel auth)
- Vijf categorieën met categoriespecifieke detailtabellen:
  Locomotief, Personenrijtuig, Goederenwagon, Smalspoor, Treinstel
- Handmatig toevoegen, bewerken en verwijderen
- Zoeken en filteren op categorie, merk, maatschappij, tijdperk
- Excel-import met automatische én handmatige kolomtoewijzing per tabblad
- Inline SVG-iconenset per type, tijdperk-kleurmarkers
- Wensenlijst-CRUD met prioriteit, maximumprijs, actief-vlag en extra
  zoektermen; importeerbaar uit Excel of CSV
- Connector-framework voor marktplaatsmonitoring met drie implementaties:
  - **eBay** via de officiële Browse API (OAuth client-credentials)
  - **Marktplaats** en **2dehands** via een lokale mailbox-folder waarop
    de meldingsmails van hun zoekopdracht-functie binnenkomen — binnen
    de algemene-voorwaarden-grens (zie ontwerpdoc §5)
- `POST /api/scan` voor handmatige scan vanuit de UI; `GET /api/scan?cron_secret=...`
  voor de dagelijkse cron-trigger door een externe scheduler
- Treffers-overzicht met status (NIEUW / GEZIEN / GEKOCHT / AFGEWEZEN),
  filteren per status, statuswisseling per regel
- E-mailmeldingen via Resend (stubt naar console zonder API-key)
- Web Push met VAPID; PWA-manifest en service worker voor installeerbare
  app op desktop en telefoon
- Foto-herkenning op `/foto`: upload van een doosfoto, OCR via Claude
  Vision, lookup tegen Märklin/Roco/Fleischmann productpagina's,
  hfkern.de (configureerbaar) en eBay-titels, bevestigingsscherm met
  pre-filled ItemForm. Zonder `ANTHROPIC_API_KEY` werkt de UI maar
  vindt OCR niets — de gebruiker vult dan handmatig in

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

## Externe scheduler instellen (dagelijkse scan)

```
0 7 * * *  curl -s "https://<host>/api/scan?cron_secret=$CRON_SECRET" > /dev/null
```

Of via Vercel Cron / GitHub Actions / Inngest. `CRON_SECRET` is een
willekeurige string in `.env` en moet overeenkomen met de querystring.

## Marktplaats / 2dehands meldingsmails

1. Maak op marktplaats.nl resp. 2dehands.be een zoekopdracht aan en zet
   *zoekopdracht-met-e-mailmelding* aan.
2. Laat die meldingsmails binnenkomen op een mailbox.
3. Sla de mails op als `.eml` of `.txt` in `inbox/marktplaats/` of
   `inbox/tweedehands/` (instelbaar via `INBOX_ROOT`).
4. Bij de eerstvolgende scan worden de mails geparseerd en als
   treffers opgeslagen. Verwerkte mails verhuizen naar `inbox/<bron>/.verwerkt/`.

Een productie-implementatie vervangt de mailbox-folder door een echte
IMAP-client.

## Volgende fases (nog niet geïmplementeerd)

- Fase 4-5: Treinsamenstellingen (Zugbildungspläne) extraheren en matchen
  tegen de collectie.
- Fase 6: PWA-polish (offline cache, install prompt), donker thema,
  dashboards.
