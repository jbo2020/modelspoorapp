import { prisma } from "./prisma";
import { sendEmail } from "./email";
import { sendPush } from "./push";
import type { MarktplaatsTreffer, WishlistItem } from "@prisma/client";

type Bundle = { wishlist: WishlistItem; treffer: MarktplaatsTreffer };

function fmtEUR(v?: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(v);
}

export async function notifyNewHits(userId: string, hits: Bundle[]): Promise<void> {
  if (hits.length === 0) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  // E-mail
  const lines = hits
    .map(
      (b) =>
        `<li><a href="${escapeHtml(b.treffer.url)}">${escapeHtml(b.treffer.titel)}</a> — ` +
        `${fmtEUR(b.treffer.prijs)} — <em>${escapeHtml(b.treffer.bron)}</em> ` +
        `(${escapeHtml(b.wishlist.omschrijving ?? "")})</li>`,
    )
    .join("");
  await sendEmail({
    to: user.email,
    subject: `${hits.length} nieuwe ${hits.length === 1 ? "treffer" : "treffers"} op je wensenlijst`,
    html: `<p>Hoi,</p><p>Er ${hits.length === 1 ? "is" : "zijn"} ${hits.length} nieuwe ${
      hits.length === 1 ? "treffer" : "treffers"
    } voor je wensenlijst:</p><ul>${lines}</ul>`,
  });

  // Push
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;
  const first = hits[0];
  const payload = {
    title: hits.length === 1 ? "Nieuwe treffer" : `${hits.length} nieuwe treffers`,
    body:
      hits.length === 1
        ? `${first.treffer.titel} — ${fmtEUR(first.treffer.prijs)}`
        : `Wensenlijst: ${hits.length} nieuwe aanbiedingen`,
    url: hits.length === 1 ? first.treffer.url : "/treffers",
  };
  await Promise.all(
    subs.map(async (s) => {
      const r = await sendPush(
        { endpoint: s.endpoint, p256dh: s.p256dh, authKey: s.authKey },
        payload,
      );
      if (r.status === 404 || r.status === 410) {
        // verlopen — opruimen
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      }
    }),
  );

  // Markeer treffers als gemeld
  await prisma.marktplaatsTreffer.updateMany({
    where: { userId, id: { in: hits.map((h) => h.treffer.id) } },
    data: { gemeldOm: new Date() },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
