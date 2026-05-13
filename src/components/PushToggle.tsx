"use client";

import { useEffect, useState } from "react";

function urlBase64ToArrayBuffer(b64: string): ArrayBuffer {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const base = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setError("Toestemming geweigerd.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch("/api/push/key");
      const { key } = (await keyRes.json()) as { key: string | null };
      if (!key) {
        setError("VAPID-sleutel niet geconfigureerd op de server.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(key),
      });
      const j = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...j, userAgent: navigator.userAgent }),
      });
      setEnabled(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-muted">
        Push-notificaties worden in deze browser niet ondersteund.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-3">
      {enabled ? (
        <button className="btn" onClick={disable} disabled={busy}>
          Push uitzetten
        </button>
      ) : (
        <button className="btn-primary" onClick={enable} disabled={busy}>
          Push-notificaties aanzetten
        </button>
      )}
      {error && <span className="text-xs text-sbb">{error}</span>}
    </div>
  );
}
