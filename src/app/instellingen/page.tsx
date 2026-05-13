import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import PushToggle from "@/components/PushToggle";

export const dynamic = "force-dynamic";

export default async function InstellingenPage() {
  const userId = await requireUserId();
  const [subs, states] = await Promise.all([
    prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.connectorState.findMany({ where: { userId } }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Instellingen</h1>
        <p className="text-sm text-muted">
          Beheer notificaties en bekijk de status van de marktplaats-connectors.
        </p>
      </div>

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold">Push-notificaties</h2>
        <p className="text-sm text-muted">
          Ontvang een melding op je apparaat wanneer er nieuwe treffers op
          je wensenlijst zijn. Werkt in de PWA en in moderne browsers; voor
          iOS-Safari moet de app als PWA op het beginscherm staan.
        </p>
        <PushToggle />
        {subs.length > 0 && (
          <ul className="text-xs text-muted">
            {subs.map((s) => (
              <li key={s.id} className="truncate">
                {s.userAgent ?? s.endpoint}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold">Connectors</h2>
        <p className="text-sm text-muted">
          Status per bron. Geconfigureerd via omgevingsvariabelen
          (zie .env.example).
        </p>
        <ul className="text-sm divide-y divide-line">
          {["EBAY", "MARKTPLAATS_MAIL", "TWEEDEHANDS_MAIL"].map((bron) => {
            const s = states.find((x) => x.bron === bron);
            return (
              <li key={bron} className="py-2 flex items-center justify-between">
                <span className="font-medium">{bron}</span>
                <span className="text-xs text-muted">
                  {s?.laatsteScan
                    ? `laatste scan ${s.laatsteScan.toLocaleString("nl-NL")}`
                    : "nog niet gescand"}
                  {s?.laatsteFout && (
                    <span className="text-sbb"> · fout: {s.laatsteFout}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
