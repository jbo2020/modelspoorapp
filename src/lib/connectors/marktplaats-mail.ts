// Marktplaats / 2dehands via inkomende meldingsmails.
//
// Aanpak: de gebruiker maakt op marktplaats.nl (resp. 2dehands.be) een
// zoekopdracht met e-mail-melding aan op een door de app gemonitorde
// mailbox. Deze connector haalt de inhoud per item uit die mails.
// Zie sectie 5 van het ontwerpdocument: dit is binnen de
// algemene-voorwaarden-grens.

import type { WishlistItem } from "@prisma/client";
import { type Connector, type RawHit, looksRelevant } from "./base";
import { readEmails, markProcessed } from "./email-mailbox";

// In de meldingsmails staat per advertentie een blok als:
//
//   Titel van de advertentie
//   € 49,95
//   https://www.marktplaats.nl/v/123456789
//
// We pakken de URL en de daar direct boven staande regels.
const LINE_RE = /^.*$/gm;

function extractHits(body: string, urlHost: RegExp): RawHit[] {
  const lines = body.match(LINE_RE) ?? [];
  const hits: RawHit[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(/(https?:\/\/[^\s)]+)/);
    if (!m) continue;
    const url = m[1];
    if (!urlHost.test(url)) continue;
    const titel = (lines[i - 2] ?? "").trim() || (lines[i - 1] ?? "").trim();
    const priceLine = (lines[i - 1] ?? "").trim();
    const pm = priceLine.match(/€\s*([\d.,]+)/);
    const prijs = pm ? parseFloat(pm[1].replace(/\./g, "").replace(",", ".")) : null;
    const externId = url.replace(/[^A-Za-z0-9]/g, "").slice(-40);
    if (titel) {
      hits.push({
        externId,
        titel,
        url,
        prijs,
        valuta: "EUR",
      });
    }
  }
  return hits;
}

class MailConnector implements Connector {
  constructor(
    public readonly bron: string,
    private readonly mailbron: string,
    private readonly urlHost: RegExp,
  ) {}

  isEnabled(): boolean {
    // Altijd "enabled": leest de lokale inbox-folder. Een echte
    // implementatie zou hier op IMAP-config controleren.
    return true;
  }

  async search(item: WishlistItem): Promise<RawHit[]> {
    const mails = await readEmails(this.mailbron);
    const out: RawHit[] = [];
    for (const mail of mails) {
      const raw = extractHits(mail.body, this.urlHost);
      for (const hit of raw) {
        hit.vondsttijdstip = mail.receivedAt;
        if (looksRelevant(item, hit)) out.push(hit);
      }
      // markeer de mail als verwerkt na de eerste run
      await markProcessed(this.mailbron, mail.id);
    }
    return out;
  }
}

export class MarktplaatsMailConnector extends MailConnector {
  constructor() {
    super("MARKTPLAATS_MAIL", "marktplaats", /marktplaats\.nl/i);
  }
}

export class TweedehandsMailConnector extends MailConnector {
  constructor() {
    super("TWEEDEHANDS_MAIL", "tweedehands", /2dehands\.be/i);
  }
}
