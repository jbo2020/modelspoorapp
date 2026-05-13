"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setMatchAction(
  positieId: string,
  itemId: string,
): Promise<void> {
  const userId = await requireUserId();
  // ownership-check: item moet van de huidige gebruiker zijn
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!item) throw new Error("Item niet gevonden");
  await prisma.samenstellingMatch.upsert({
    where: { userId_positieId: { userId, positieId } },
    update: { itemId },
    create: { userId, positieId, itemId },
  });
  const pos = await prisma.samenstellingPositie.findUnique({
    where: { id: positieId },
    select: { typeId: true },
  });
  if (pos) revalidatePath(`/samenstellingen/${pos.typeId}`);
}

export async function clearMatchAction(positieId: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.samenstellingMatch.deleteMany({
    where: { userId, positieId },
  });
  const pos = await prisma.samenstellingPositie.findUnique({
    where: { id: positieId },
    select: { typeId: true },
  });
  if (pos) revalidatePath(`/samenstellingen/${pos.typeId}`);
}

export async function positieNaarWensenlijstAction(
  positieId: string,
): Promise<void> {
  const userId = await requireUserId();
  const pos = await prisma.samenstellingPositie.findUnique({
    where: { id: positieId },
    include: {
      type: {
        include: {
          treindiensten: { orderBy: { jaar: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!pos) throw new Error("Positie niet gevonden");
  const dienst = pos.type.treindiensten[0];
  const onderdelen = [
    pos.vereistSerie,
    pos.vereistKlasse ? `${pos.vereistKlasse}e klasse` : null,
    dienst?.maatschappij,
  ].filter(Boolean);
  const omschrijving = onderdelen.join(" — ") || "Ontbrekend rijtuig";
  const notities = [
    `Voor samenstellingstype ${pos.type.lokSerie ?? ""} (${pos.type.aantalPosities} posities)`,
    dienst
      ? `bv. ${dienst.treinnummer}${dienst.jaar ? ` (${dienst.jaar})` : ""}`
      : null,
    pos.opmerking,
  ]
    .filter(Boolean)
    .join("\n");
  const wens = await prisma.wishlistItem.create({
    data: {
      userId,
      omschrijving,
      merk: null,
      maxPrijs: null,
      prioriteit: 1,
      actief: true,
      zoektermen: pos.vereistSerie ?? null,
      notities,
    },
  });
  revalidatePath("/wensenlijst");
  redirect(`/wensenlijst/${wens.id}`);
}
