// Gedeelde inbox-fetcher voor de e-mailgebaseerde connectors
// (Marktplaats en 2dehands).
//
// Voor Fase 2 is dit een lichte stub: hij leest een lokale map
// `inbox/<bron>/` met `.eml`-bestanden in plaats van een echte IMAP-
// verbinding. Dat houdt de Phase 2 testbaar zonder een mailbox te
// hoeven configureren. Een productie-implementatie vervangt
// readEml() door een echte IMAP-client (imapflow of node-imap).

import { readdir, readFile, rename, mkdir } from "node:fs/promises";
import { join } from "node:path";

export type RawEmail = {
  id: string;        // filename of message-id
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
};

const INBOX_ROOT = process.env.INBOX_ROOT || join(process.cwd(), "inbox");

export async function readEmails(bron: string): Promise<RawEmail[]> {
  const dir = join(INBOX_ROOT, bron);
  try {
    await mkdir(dir, { recursive: true });
    const files = await readdir(dir);
    const out: RawEmail[] = [];
    for (const f of files) {
      if (!f.endsWith(".eml") && !f.endsWith(".txt")) continue;
      const raw = await readFile(join(dir, f), "utf-8");
      out.push(parseSimpleEml(f, raw));
    }
    return out;
  } catch {
    return [];
  }
}

export async function markProcessed(bron: string, id: string): Promise<void> {
  const dir = join(INBOX_ROOT, bron);
  const done = join(dir, ".verwerkt");
  try {
    await mkdir(done, { recursive: true });
    await rename(join(dir, id), join(done, id));
  } catch {
    // ignore
  }
}

function parseSimpleEml(filename: string, raw: string): RawEmail {
  const headerEnd = raw.indexOf("\n\n");
  const headerBlock = headerEnd === -1 ? raw : raw.slice(0, headerEnd);
  const body = headerEnd === -1 ? "" : raw.slice(headerEnd + 2);
  const headers: Record<string, string> = {};
  for (const line of headerBlock.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (m) headers[m[1].toLowerCase()] = m[2];
  }
  return {
    id: filename,
    from: headers["from"] ?? "",
    subject: headers["subject"] ?? "",
    body,
    receivedAt: headers["date"] ? new Date(headers["date"]) : new Date(),
  };
}
