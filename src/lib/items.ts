"use server";

import { prisma } from "./prisma";
import { requireUserId } from "./auth";
import { z } from "zod";
import { CATEGORIES, type Categorie } from "./types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const baseSchema = z.object({
  categorie: z.enum(CATEGORIES),
  merk: z.string().min(1, "Merk is verplicht"),
  artikelnummer: z.string().optional().nullable(),
  typeAanduiding: z.string().optional().nullable(),
  maatschappij: z.string().optional().nullable(),
  schaal: z.string().optional().nullable(),
  tijdperk: z.string().optional().nullable(),
  aanschafprijs: z.coerce.number().nonnegative().optional().nullable(),
  huidigeWaarde: z.coerce.number().nonnegative().optional().nullable(),
  aankoopdatum: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
  aantal: z.coerce.number().int().min(1).default(1),
  set: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === true),
  trein: z.string().optional().nullable(),
  status: z.enum(["IN_BEZIT", "VERKOCHT"]).default("IN_BEZIT"),
  notities: z.string().optional().nullable(),
  // detailvelden — afhankelijk van categorie
  loknummer: z.string().optional().nullable(),
  kopstaart: z.string().optional().nullable(),
  soort: z.string().optional().nullable(),
  wagennummer: z.string().optional().nullable(),
  wagentype: z.string().optional().nullable(),
  vasteTrein: z.string().optional().nullable(),
  subcategorie: z.string().optional().nullable(),
  aantalDelen: z.coerce.number().int().optional().nullable(),
  decoderadres: z.coerce.number().int().optional().nullable(),
  stroomtype: z.string().optional().nullable(),
});

export type ItemInput = z.infer<typeof baseSchema>;

function emptyToNull<T>(v: T): T | null {
  if (v === "" || v === undefined) return null;
  return v;
}

function detailForCategorie(cat: Categorie, d: ItemInput) {
  switch (cat) {
    case "LOCOMOTIEF":
      return { loc: { loknummer: emptyToNull(d.loknummer ?? null), kopstaart: emptyToNull(d.kopstaart ?? null) } };
    case "PERSONENRIJTUIG":
      return { personen: { soort: emptyToNull(d.soort ?? null), wagennummer: emptyToNull(d.wagennummer ?? null) } };
    case "GOEDERENWAGON":
      return {
        goederen: {
          wagentype: emptyToNull(d.wagentype ?? null),
          wagennummer: emptyToNull(d.wagennummer ?? null),
          vasteTrein: emptyToNull(d.vasteTrein ?? null),
        },
      };
    case "SMALSPOOR":
      return {
        smal: {
          subcategorie: emptyToNull(d.subcategorie ?? null),
          loknummer: emptyToNull(d.loknummer ?? null),
          kopstaart: emptyToNull(d.kopstaart ?? null),
          wagennummer: emptyToNull(d.wagennummer ?? null),
        },
      };
    case "TREINSTEL":
      return {
        treinstel: {
          aantalDelen: d.aantalDelen ?? null,
          decoderadres: d.decoderadres ?? null,
          stroomtype: emptyToNull(d.stroomtype ?? null),
        },
      };
  }
}

function parseForm(formData: FormData): ItemInput {
  const obj: Record<string, FormDataEntryValue | null> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  return baseSchema.parse(obj);
}

export async function createItemAction(formData: FormData) {
  const userId = await requireUserId();
  const data = parseForm(formData);
  const det = detailForCategorie(data.categorie, data);
  await prisma.item.create({
    data: {
      userId,
      categorie: data.categorie,
      merk: data.merk,
      artikelnummer: data.artikelnummer || null,
      typeAanduiding: data.typeAanduiding || null,
      maatschappij: data.maatschappij || null,
      schaal: data.schaal || null,
      tijdperk: data.tijdperk || null,
      aanschafprijs: data.aanschafprijs ?? null,
      huidigeWaarde: data.huidigeWaarde ?? null,
      aankoopdatum: data.aankoopdatum ?? null,
      aantal: data.aantal,
      set: data.set,
      trein: data.trein || null,
      status: data.status,
      notities: data.notities || null,
      ...(det.loc && { loc: { create: det.loc } }),
      ...(det.personen && { personen: { create: det.personen } }),
      ...(det.goederen && { goederen: { create: det.goederen } }),
      ...(det.smal && { smal: { create: det.smal } }),
      ...(det.treinstel && { treinstel: { create: det.treinstel } }),
    },
  });
  revalidatePath("/");
  redirect("/");
}

export async function updateItemAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  const existing = await prisma.item.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("NOT_FOUND");
  const data = parseForm(formData);
  const det = detailForCategorie(data.categorie, data);
  await prisma.$transaction([
    prisma.locomotiefDetail.deleteMany({ where: { itemId: id } }),
    prisma.personenrijtuigDetail.deleteMany({ where: { itemId: id } }),
    prisma.goederenwagonDetail.deleteMany({ where: { itemId: id } }),
    prisma.smalspoorDetail.deleteMany({ where: { itemId: id } }),
    prisma.treinstelDetail.deleteMany({ where: { itemId: id } }),
    prisma.item.update({
      where: { id },
      data: {
        categorie: data.categorie,
        merk: data.merk,
        artikelnummer: data.artikelnummer || null,
        typeAanduiding: data.typeAanduiding || null,
        maatschappij: data.maatschappij || null,
        schaal: data.schaal || null,
        tijdperk: data.tijdperk || null,
        aanschafprijs: data.aanschafprijs ?? null,
        huidigeWaarde: data.huidigeWaarde ?? null,
        aankoopdatum: data.aankoopdatum ?? null,
        aantal: data.aantal,
        set: data.set,
        trein: data.trein || null,
        status: data.status,
        notities: data.notities || null,
        ...(det.loc && { loc: { create: det.loc } }),
        ...(det.personen && { personen: { create: det.personen } }),
        ...(det.goederen && { goederen: { create: det.goederen } }),
        ...(det.smal && { smal: { create: det.smal } }),
        ...(det.treinstel && { treinstel: { create: det.treinstel } }),
      },
    }),
  ]);
  revalidatePath("/");
  revalidatePath(`/collectie/${id}`);
  redirect(`/collectie/${id}`);
}

export async function deleteItemAction(id: string) {
  const userId = await requireUserId();
  await prisma.item.deleteMany({ where: { id, userId } });
  revalidatePath("/");
  redirect("/");
}
