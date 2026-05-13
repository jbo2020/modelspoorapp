// eBay-connector via de officiële Browse API.
//
// Auth: client-credentials OAuth (EBAY_APP_ID + EBAY_CERT_ID). Token wordt
// in-memory gecached. Endpoint: https://api.ebay.com/buy/browse/v1/item_summary/search
//
// Zonder credentials gedraagt de connector zich als uitgeschakeld; de
// scan-runner slaat hem dan over zonder fout.

import type { WishlistItem } from "@prisma/client";
import { type Connector, type RawHit, buildSearchQuery } from "./base";

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.EBAY_APP_ID;
  const secret = process.env.EBAY_CERT_ID;
  if (!id || !secret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`eBay token ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

type EbaySummary = {
  itemId: string;
  title: string;
  itemWebUrl: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  shortDescription?: string;
};

export class EbayConnector implements Connector {
  readonly bron = "EBAY";

  isEnabled(): boolean {
    return !!(process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID);
  }

  async search(item: WishlistItem): Promise<RawHit[]> {
    const token = await getToken();
    if (!token) return [];
    const q = buildSearchQuery(item);
    if (!q) return [];
    const url = new URL(SEARCH_URL);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "25");
    url.searchParams.set("category_ids", "180251"); // "Modelspoorbanen"
    if (item.maxPrijs != null) {
      url.searchParams.set("filter", `price:[..${item.maxPrijs}],priceCurrency:EUR`);
    }
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_NL",
        "Accept-Language": "nl-NL",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`eBay search ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { itemSummaries?: EbaySummary[] };
    return (data.itemSummaries ?? []).map((s) => ({
      externId: s.itemId,
      titel: s.title,
      url: s.itemWebUrl,
      prijs: s.price ? parseFloat(s.price.value) : null,
      valuta: s.price?.currency ?? null,
      thumbnailUrl: s.image?.imageUrl ?? null,
      beschrijving: s.shortDescription ?? null,
    }));
  }
}
