import type { Connector } from "./base";
import { EbayConnector } from "./ebay";
import { MarktplaatsMailConnector, TweedehandsMailConnector } from "./marktplaats-mail";

export function allConnectors(): Connector[] {
  return [
    new EbayConnector(),
    new MarktplaatsMailConnector(),
    new TweedehandsMailConnector(),
  ];
}

export { type Connector, type RawHit } from "./base";
