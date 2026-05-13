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

## Testen

Er is (nog) geen geautomatiseerd testframework geconfigureerd; testen
gebeurt via build-/lintchecks plus handmatige smoke-tests in de browser.

### Sanity-checks

```bash
npm run lint           # ESLint via next lint
npm run build          # prisma generate + next build — vangt typefouten
                       # en build-time errors af
```

Een schone `lint` en succesvolle `build` zijn een harde voorwaarde voor
PR-merges.

### Lokale testomgeving opzetten

```bash
cp .env.example .env   # vul AUTH_SECRET + SEED_USER_* in
npm install
npm run db:push        # vers SQLite-schema (./dev.db)
npm run db:seed        # demo-gebruiker + voorbeelditems
npm run dev            # http://localhost:3000
```

Reset tussen testruns: verwijder `dev.db` en draai `db:push` + `db:seed`
opnieuw, zodat je vanuit een bekende staat begint.

### Handmatige smoke-tests per fase

**Fase 1 — Kerncollectie**

1. Log in met de seed-credentials.
2. Voeg per categorie (Locomotief, Personenrijtuig, Goederenwagon,
   Smalspoor, Treinstel) één item toe en controleer dat de
   categoriespecifieke velden verschijnen en worden opgeslagen.
3. Bewerk en verwijder een item; controleer dat de detailtabel meegaat.
4. Test de filters op categorie, merk, maatschappij en tijdperk en de
   zoekbalk.
5. Importeer een Excel-bestand via `/import`, zowel met automatische
   als met handmatige kolomtoewijzing per tabblad.

**Fase 2 — Wensenlijst + monitoring**

1. Maak via `/wensen` een wensregel aan met prioriteit, maximumprijs,
   actief-vlag en extra zoektermen; importeer er ook een uit Excel/CSV.
2. eBay-connector: vul `EBAY_APP_ID` + `EBAY_CERT_ID` of laat leeg om de
   stub-modus te testen.
3. Marktplaats / 2dehands: leg een `.eml`- of `.txt`-meldingsmail in
   `inbox/marktplaats/` resp. `inbox/tweedehands/`.
4. Trigger een scan via de knop in de UI (`POST /api/scan`) of via
   `curl "http://localhost:3000/api/scan?cron_secret=$CRON_SECRET"`.
5. Controleer in het treffers-overzicht: filteren per status en
   statuswisseling NIEUW → GEZIEN → GEKOCHT / AFGEWEZEN.
6. Zonder `RESEND_API_KEY` logt e-mail naar de console — verifieer de
   regels in de devserver-output.
7. Web Push: genereer VAPID-keys (`npx web-push generate-vapid-keys`),
   abonneer in de browser en draai een scan met nieuwe treffers.

**Fase 3 — Foto-herkenning**

1. Open `/foto` en upload een doosfoto.
2. Met `ANTHROPIC_API_KEY` ingevuld: controleer dat OCR resultaten
   geeft en het bevestigingsscherm een pre-filled `ItemForm` toont.
3. Zonder API-key: controleer dat de upload-flow werkt en de gebruiker
   handmatig kan invullen (stub-modus).
4. Verifieer dat `tmp/fotos/` na ~1 uur wordt opgeruimd (of forceer
   handmatig).

### PWA / installeerbaarheid

Bouw productie en serveer:

```bash
npm run build && npm start
```

Open Chrome DevTools → Application → Manifest + Service Workers en
controleer of het manifest geldig is en de service worker registreert.
Test de install-prompt op desktop en mobiel.

### Cron-trigger testen

```bash
curl -i "http://localhost:3000/api/scan?cron_secret=$CRON_SECRET"
```

Verwacht `200 OK` mét correcte `cron_secret`, `401`/`403` zonder of bij
een verkeerde waarde.

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
