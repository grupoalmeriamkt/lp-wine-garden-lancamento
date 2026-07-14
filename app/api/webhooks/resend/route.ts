import { NextRequest, NextResponse } from "next/server";
import { insertEmailEvent } from "@/lib/store";
import type { EmailEventType } from "@/lib/types";

export const runtime = "nodejs";

const MAP: Record<string, EmailEventType> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

async function verify(
  secret: string,
  id: string,
  ts: string,
  payload: string,
  header: string
): Promise<boolean> {
  const keyB64 = secret.replace(/^whsec_/, "");
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${ts}.${payload}`)
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  // Header vem como "v1,<b64> v1,<b64>...": comparar com qualquer um.
  return header
    .split(" ")
    .map((p) => p.split(",")[1])
    .some((s) => s === expected);
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const payload = await req.text();

  if (secret) {
    const id = req.headers.get("svix-id") ?? "";
    const ts = req.headers.get("svix-timestamp") ?? "";
    const sigHeader = req.headers.get("svix-signature") ?? "";
    const ok = await verify(secret, id, ts, payload, sigHeader);
    if (!ok) return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  const evt = JSON.parse(payload) as {
    type: string;
    data?: {
      email_id?: string;
      to?: string | string[];
      tags?: Record<string, string> | { name: string; value: string }[];
    };
    created_at?: string;
  };

  const type = MAP[evt.type];
  if (!type) return NextResponse.json({ ok: true, ignored: evt.type });

  const to = Array.isArray(evt.data?.to) ? evt.data?.to[0] : evt.data?.to;
  let code: string | undefined;
  const tags = evt.data?.tags;
  if (Array.isArray(tags)) code = tags.find((t) => t.name === "voucher_code")?.value;
  else if (tags && typeof tags === "object") code = (tags as Record<string, string>).voucher_code;

  await insertEmailEvent({
    id: crypto.randomUUID(),
    resend_id: evt.data?.email_id ?? null,
    email: to ?? "",
    voucher_code: code ?? null,
    type,
    created_at: evt.created_at ?? new Date().toISOString(),
    raw: evt,
  });

  return NextResponse.json({ ok: true });
}
