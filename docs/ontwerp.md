# Technisch Ontwerpdocument
## Modelspoor Collectie App

*Versie 1.0 — opgesteld op basis van het interview*

---

## 1. Doel en scope

De app is een persoonlijke beheerapplicatie voor een modelspoorverzameling van circa 200 tot 500 stuks, gericht op Zwitsers materieel (SBB en gerelateerde maatschappijen als BLS, MBC, Wascosa, Jura Cement, AAE, SOB, RhB en SBB Cargo), met internationale uitloop voor doorgaande treinen. Het is een single-user systeem dat draait als responsieve webapplicatie op zowel desktop als telefoon, met automatische synchronisatie tussen apparaten via de cloud. De applicatie combineert klassiek collectiebeheer (inventaris, waarde, wensenlijst) met drie slimme functies: foto-naar-data herkenning van artikelnummers, vergelijking van de collectie met echte historische treinsamenstellingen uit de Zwitserse Zugbildungspläne van de SBB, en dagelijkse monitoring van marktplaatsen op wensenlijst-items.

Wat bewust buiten scope valt: meerdere gebruikers, gedeelde collecties, foto's per modelitem, conditie-tracking, lijngebonden inrichting (banen, baanvakken), en automatische exports of verzekeringsrapporten.

## 2. Functionele eisen

### Collectiebeheer

Elk fysiek item wordt geregistreerd; voor losse modellen geldt één regel per item, voor identieke modellen die als set zijn gekocht (bijvoorbeeld vier suikerwagons of een rake EW I-rijtuigen) blijft een aantal-veld pragmatisch toegestaan op één regel. De collectie kent vijf vaste hoofdcategorieën, gebaseerd op de bestaande Excel-structuur:

- **Locomotieven** — alle losse tractiemiddelen (elektrisch, diesel, stoom).
- **Personenrijtuigen** — reizigersmaterieel, uitgesplitst per soort (zitrijtuig, couchette, slaaprijtuig, restauratie- of barrijtuig, panoramarijtuig, stuurstandrijtuig, bagagerijtuig, postwagen).
- **Goederenwagons** — vrachtmaterieel, uitgesplitst per wagentype (suikerwagen, schuifwandwagen, taschenwagen, containerwagen, ketelwagen, autotransporter, zelflosser, gesloten/open wagen, koelwagen, post).
- **Smalspoor** — afzonderlijk omdat de schaal (typisch H0m) en het rollend materieel afwijken; vaak Furka–Oberalp, RhB of Brünig.
- **Treinstellen** — meerdelige eenheden die als één treinstel rijden (ICN, FLIRT, NPZ, RABe, RBDe, TEE Rae). Hier hoort ook een 'aantal delen' en decoder-adres bij, omdat treinstellen meestal als één unit worden bestuurd.

De gemeenschappelijke basisvelden zijn merk, artikelnummer, type-aanduiding, maatschappij, tijdperk (Zwitserse/MOROP-indicatie I tot en met VI, ook tussenwaardes als IV/V toegestaan), aanschafprijs, huidige waarde, aantal, set (ja/nee — onderdeel van een gekochte rake), trein (welke trein dit model bedient, bijvoorbeeld "EN Wiener Walzer" of "EC Raffaello") en een vrij opmerkingenveld.

Categoriespecifieke velden:
- *Locomotieven en smalspoorloks*: loknummer, kop-/staartdetail (bijvoorbeeld "Affoltern am Albis", "Kuoni", "TEE", "Cargo").
- *Personenrijtuigen*: soort (zie hierboven), wagennummer (UIC-formaat, bijvoorbeeld "61 85 20-90 235-3").
- *Goederenwagons*: wagentype, wagennummer, "vaste trein" indien gekoppeld aan een vaste samenstelling.
- *Treinstellen*: aantal delen, decoderadres, opmerkingen over DC/AC en digitaal of analoog.

(Voor het volledige ontwerp zie de oorspronkelijke versie — secties 3 t/m 9 beschrijven architectuur, datamodel, slimme functies, Zugbildungspläne, visueel ontwerp, risico's, gefaseerde planning en open punten.)

---

Deze repository implementeert **Fase 1 — Kerncollectie** uit het stappenplan:
webapp + auth + 5 categorieën + handmatig toevoegen + Excel-import + zoeken/filteren + iconen per type.
