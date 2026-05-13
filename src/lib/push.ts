// Web Push via VAPID. Gebruikt geen npm-dependency: ondertekent de JWT
// en versleutelt de payload zelf met node:crypto. Werkt op de Node-
// runtime (zie route runtime = "nodejs").

import { createHash, createHmac, createSign, createCipheriv, createECDH, randomBytes, createPrivateKey, sign as cryptoSign } from "node:crypto";

const VAPID_PUB = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIV = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com";

export function pushEnabled(): boolean {
  return !!(VAPID_PUB && VAPID_PRIV);
}

export function publicVapidKey(): string | null {
  return VAPID_PUB ?? null;
}

function urlBase64ToBuffer(b64: string): Buffer {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  return Buffer.from((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function bufferToUrlBase64(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number): Buffer {
  const prk = createHmac("sha256", salt).update(ikm).digest();
  const out = Buffer.alloc(length);
  let prev = Buffer.alloc(0);
  let pos = 0;
  let counter = 1;
  while (pos < length) {
    const h = createHmac("sha256", prk);
    h.update(prev);
    h.update(info);
    h.update(Buffer.from([counter]));
    prev = h.digest();
    prev.copy(out, pos);
    pos += prev.length;
    counter++;
  }
  return out.slice(0, length);
}

function jwkPrivateFromRaw(raw: Buffer): import("node:crypto").KeyObject {
  // raw 32-byte private key voor P-256 → JWK om met createSign(ES256) te
  // kunnen ondertekenen. We hebben ook het publieke punt nodig: dat
  // halen we via ECDH.
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(raw);
  const pub = ecdh.getPublicKey(); // 65 bytes, 0x04 || X || Y
  const x = pub.subarray(1, 33);
  const y = pub.subarray(33, 65);
  return createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: bufferToUrlBase64(raw),
      x: bufferToUrlBase64(x),
      y: bufferToUrlBase64(y),
    },
    format: "jwk",
  });
}

function signVapid(audience: string): string {
  if (!VAPID_PRIV) throw new Error("VAPID niet geconfigureerd");
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: VAPID_SUBJECT,
  };
  const enc = (o: object) => bufferToUrlBase64(Buffer.from(JSON.stringify(o)));
  const data = `${enc(header)}.${enc(payload)}`;
  const privRaw = urlBase64ToBuffer(VAPID_PRIV);
  const key = jwkPrivateFromRaw(privRaw);
  // ES256 → JOSE-formaat (raw R||S 64 bytes)
  const der = cryptoSign("sha256", Buffer.from(data), { key, dsaEncoding: "ieee-p1363" });
  return `${data}.${bufferToUrlBase64(Buffer.from(der))}`;
}

export type Subscription = {
  endpoint: string;
  p256dh: string;
  authKey: string;
};

function audienceFor(endpoint: string): string {
  const u = new URL(endpoint);
  return `${u.protocol}//${u.host}`;
}

function encryptPayload(subscription: Subscription, payload: Buffer) {
  // aes128gcm content encoding (RFC 8291).
  const userPub = urlBase64ToBuffer(subscription.p256dh);
  const authSecret = urlBase64ToBuffer(subscription.authKey);
  const ecdh = createECDH("prime256v1");
  const ourPub = ecdh.generateKeys();
  const shared = ecdh.computeSecret(userPub);
  const salt = randomBytes(16);
  const prkKey = hkdf(authSecret, shared, Buffer.concat([
    Buffer.from("WebPush: info\0"), userPub, ourPub,
  ]), 32);
  const cek = hkdf(salt, prkKey, Buffer.concat([Buffer.from("Content-Encoding: aes128gcm\0")]), 16);
  const nonce = hkdf(salt, prkKey, Buffer.concat([Buffer.from("Content-Encoding: nonce\0")]), 12);

  const padded = Buffer.concat([payload, Buffer.from([0x02])]);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final(), cipher.getAuthTag()]);

  // header: salt(16) || rs(4) || idlen(1) || keyid(idlen)
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096, 0);
  const header = Buffer.concat([salt, rs, Buffer.from([ourPub.length]), ourPub]);
  return Buffer.concat([header, encrypted]);
}

export async function sendPush(
  subscription: Subscription,
  payload: object,
): Promise<{ ok: boolean; status: number; statusText: string }> {
  if (!pushEnabled()) {
    console.log(`[push:stub] -> ${subscription.endpoint}: ${JSON.stringify(payload)}`);
    return { ok: true, status: 200, statusText: "stub" };
  }
  const body = encryptPayload(subscription, Buffer.from(JSON.stringify(payload)));
  const audience = audienceFor(subscription.endpoint);
  const jwt = signVapid(audience);
  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      Authorization: `vapid t=${jwt}, k=${VAPID_PUB}`,
      TTL: "86400",
      Urgency: "normal",
    },
    body,
  });
  return { ok: res.ok, status: res.status, statusText: res.statusText };
}
