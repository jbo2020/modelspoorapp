"use server";

import { prisma } from "./prisma";
import { requireUserId } from "./auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const wishlistSchema = z.object({
  artikelnummer: z.string().optional().nullable(),
  merk: z.string().optional().nullable(),
  omschrijving: z.string().min(1, "Omschrijving is verplicht"),
  maxPrijs: z.coerce.number().nonnegative().optional().nullable(),
  prioriteit: z.coerce.number().int().min(0).max(5).default(0),
  zoektermen: z.string().optional().nullable(),
  actief: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === true),
  notities: z.string().optional().nullable(),
});

function parseForm(fd: FormData) {
  const obj: Record<string, FormDataEntryValue | null> = {};
  for (const [k, v] of fd.entries()) obj[k] = v;
  // checkboxes die uit staan komen niet in FormData; default false
  if (!("actief" in obj)) obj.actief = "false";
  return wishlistSchema.parse(obj);
}

function cleanStrings<T extends Record<string, unknown>>(d: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) out[k] = v === "" ? null : v;
  return out;
}

export async function createWishlistAction(formData: FormData) {
  const userId = await requireUserId();
  const data = parseForm(formData);
  const cleaned = cleanStrings(data) as typeof data;
  await prisma.wishlistItem.create({ data: { ...cleaned, userId } });
  revalidatePath("/wensenlijst");
  redirect("/wensenlijst");
}

export async function updateWishlistAction(id: string, formData: FormData) {
  const userId = await requireUserId();
  const existing = await prisma.wishlistItem.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("NOT_FOUND");
  const data = parseForm(formData);
  const cleaned = cleanStrings(data) as typeof data;
  await prisma.wishlistItem.update({ where: { id }, data: cleaned });
  revalidatePath("/wensenlijst");
  revalidatePath(`/wensenlijst/${id}`);
  redirect(`/wensenlijst/${id}`);
}

export async function deleteWishlistAction(id: string) {
  const userId = await requireUserId();
  await prisma.wishlistItem.deleteMany({ where: { id, userId } });
  revalidatePath("/wensenlijst");
  redirect("/wensenlijst");
}

export async function setTrefferStatusAction(id: string, status: string) {
  const userId = await requireUserId();
  if (!["NIEUW", "GEZIEN", "GEKOCHT", "AFGEWEZEN"].includes(status)) return;
  await prisma.marktplaatsTreffer.updateMany({
    where: { id, userId },
    data: { status },
  });
  revalidatePath("/treffers");
}
