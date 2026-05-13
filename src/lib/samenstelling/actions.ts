"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { suggestiesVoorPositie } from "./match";

/**
 * Automatische matching voor alle posities van een samenstellingstype
 * waar de gebruiker nog geen handmatige keuze heeft gemaakt. Score-drempel
 * `> 1` zorgt dat we niet zomaar het eerste-beste item van de juiste
 * categorie pakken — er moet ten minste een type- of nummermatch zijn.
 *
 * Idempotent: bestaande matches worden NIET overschreven. Eén call per
 * paginalaad is voldoende.
 */
export async function autoMatchVoorTypeAction(typeId: string): Promise<void> {
  const userId = await requireUserId();
  const type = await prisma.samenstellingstype.findUnique({
    where: { id: typeId },
    include: { posities: { orderBy: { positie: "asc" } } },
  });
  if (!type) return;

  // Welke posities zijn nog onbevestigd?
  const bestaandeMatches = await prisma.samenstellingMatch.findMany({
    where: { userId, positieId: { in: type.posities.map((p) => p.id) } },
    select: { positieId: true },
  });
  const reedsGematcht = new Set(bestaandeMatches.map((m) => m.positieId));
  const teMatchen = type.posities.filter((p) => !reedsGematcht.has(p.id));
  if (teMatchen.length === 0) return;

  // Schaal-hint: meest voorkomende schaal in de collectie.
  const schaalGroep = await prisma.item.groupBy({
    by: ["schaal"],
    where: { userId, schaal: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { schaal: "desc" } },
    take: 1,
  });
  const schaalHint = schaalGroep[0]?.schaal ?? null;

  for (const positie of teMatchen) {
    const suggesties = await suggestiesVoorPositie(positie, userId, schaalHint, 1);
    const beste = suggesties[0];
    if (!beste || beste.score <= 1) continue; // geen overtuigende match
    await prisma.samenstellingMatch
      .create({
        data: {
          userId,
          positieId: positie.id,
          itemId: beste.itemId,
          accuratesseNote: "auto",
        },
      })
      .catch(() => {
        // race / al gematcht — negeer
      });
  }
  revalidatePath(`/samenstellingen/${typeId}`);
}

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
