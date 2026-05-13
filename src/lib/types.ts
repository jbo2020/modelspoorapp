export const CATEGORIES = [
  "LOCOMOTIEF",
  "PERSONENRIJTUIG",
  "GOEDERENWAGON",
  "SMALSPOOR",
  "TREINSTEL",
] as const;
export type Categorie = (typeof CATEGORIES)[number];

export const CATEGORIE_LABEL: Record<Categorie, string> = {
  LOCOMOTIEF: "Locomotief",
  PERSONENRIJTUIG: "Personenrijtuig",
  GOEDERENWAGON: "Goederenwagon",
  SMALSPOOR: "Smalspoor",
  TREINSTEL: "Treinstel",
};

export const CATEGORIE_LABEL_PLURAL: Record<Categorie, string> = {
  LOCOMOTIEF: "Locomotieven",
  PERSONENRIJTUIG: "Personenrijtuigen",
  GOEDERENWAGON: "Goederenwagons",
  SMALSPOOR: "Smalspoor",
  TREINSTEL: "Treinstellen",
};

export const TIJDPERKEN = ["I", "II", "III", "IV", "IV/V", "V", "V/VI", "VI"] as const;
export type Tijdperk = (typeof TIJDPERKEN)[number];

export const PERSONEN_SOORT = [
  "zitrijtuig",
  "couchette",
  "slaaprijtuig",
  "restauratie",
  "panorama",
  "stuurstand",
  "bagage",
  "post",
] as const;

export const WAGEN_TYPE = [
  "suiker",
  "schuifwand",
  "taschen",
  "container",
  "ketel",
  "autotransport",
  "zelflosser",
  "gesloten",
  "open",
  "koel",
  "post",
] as const;

export const SMALSPOOR_SUB = ["loc", "rijtuig", "wagon"] as const;

export function isCategorie(v: unknown): v is Categorie {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}

export function eraColorClass(tijdperk?: string | null): string {
  if (!tijdperk) return "bg-line text-muted";
  const first = tijdperk.split("/")[0];
  const map: Record<string, string> = {
    I: "bg-era-1/15 text-era-1 ring-era-1/30",
    II: "bg-era-2/15 text-era-2 ring-era-2/30",
    III: "bg-era-3/15 text-era-3 ring-era-3/30",
    IV: "bg-era-4/15 text-era-4 ring-era-4/30",
    V: "bg-era-5/15 text-era-5 ring-era-5/30",
    VI: "bg-era-6/15 text-era-6 ring-era-6/30",
  };
  return map[first] ?? "bg-line text-muted";
}
