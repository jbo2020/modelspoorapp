// Lichte e-mail-wrapper. Gebruikt Resend wanneer RESEND_API_KEY is gezet,
// anders logt hij naar de console (handig voor lokale ontwikkeling).

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(p: EmailPayload): Promise<{ ok: boolean; via: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Modelspoor <noreply@example.com>";
  if (!key) {
    console.log(`[email:stub] to=${p.to} subject="${p.subject}"`);
    return { ok: true, via: "stub" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: p.to, subject: p.subject, html: p.html, text: p.text }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("resend error", await res.text());
    return { ok: false, via: "resend" };
  }
  return { ok: true, via: "resend" };
}
