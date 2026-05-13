// Wikipedia MediaWiki API-adapter voor het ophalen van een page-image
// per loc-/rijtuig-serie. Probeert de.wikipedia → en.wikipedia → nl.wikipedia
// in die volgorde, want Zwitsers materieel heeft typisch de uitvoerigste
// pagina's op de Duitse Wikipedia.
//
// Wikipedia is sandbox-niet-bereikbaar vanuit mijn omgeving (Host not in
// allowlist), maar werkt vanaf elke normale internetverbinding. Bij een
// netwerk- of API-fout retourneert deze adapter `null` zodat de cache
// een negatief resultaat kan vastleggen.

export type WikiImage = {
  imageUrl: string;
  thumbUrl: string;
  caption: string;
  source: string;
  language: string;
};

type ApiPage = {
  pageid: number;
  title: string;
  thumbnail?: { source: string; width: number; height: number };
  original?: { source: string };
  fullurl?: string;
};

type ApiResponse = {
  query?: {
    pages?: Record<string, ApiPage>;
    search?: Array<{ title: string }>;
  };
};

async function fetchJson(url: string): Promise<ApiResponse | null> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "ModelspoorCollectieApp/1.0 (persoonlijk gebruik; contact via app)",
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as ApiResponse;
}

async function probeerTaal(
  taal: string,
  zoekterm: string,
): Promise<WikiImage | null> {
  // Stap 1: full-text search om de juiste pagina te vinden.
  const zoekUrl = new URL(`https://${taal}.wikipedia.org/w/api.php`);
  zoekUrl.searchParams.set("action", "query");
  zoekUrl.searchParams.set("format", "json");
  zoekUrl.searchParams.set("list", "search");
  zoekUrl.searchParams.set("srlimit", "1");
  zoekUrl.searchParams.set("srsearch", zoekterm);
  zoekUrl.searchParams.set("origin", "*");
  const zoekRes = await fetchJson(zoekUrl.toString());
  const titel = zoekRes?.query?.search?.[0]?.title;
  if (!titel) return null;

  // Stap 2: page-image + meta-info van die titel.
  const pageUrl = new URL(`https://${taal}.wikipedia.org/w/api.php`);
  pageUrl.searchParams.set("action", "query");
  pageUrl.searchParams.set("format", "json");
  pageUrl.searchParams.set("prop", "pageimages|info");
  pageUrl.searchParams.set("inprop", "url");
  pageUrl.searchParams.set("piprop", "thumbnail|original");
  pageUrl.searchParams.set("pithumbsize", "400");
  pageUrl.searchParams.set("titles", titel);
  pageUrl.searchParams.set("origin", "*");
  const pageRes = await fetchJson(pageUrl.toString());
  const pages = pageRes?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page?.thumbnail) return null;
  return {
    imageUrl: page.original?.source ?? page.thumbnail.source,
    thumbUrl: page.thumbnail.source,
    caption: page.title,
    source: page.fullurl ?? `https://${taal}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    language: taal,
  };
}

const TALEN = ["de", "en", "nl"] as const;

export async function zoekWikipediaImage(
  serie: string,
): Promise<WikiImage | null> {
  for (const taal of TALEN) {
    try {
      const hit = await probeerTaal(taal, serie);
      if (hit) return hit;
    } catch {
      // ga door naar volgende taal
    }
  }
  return null;
}
