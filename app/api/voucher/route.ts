import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { findLeadByPhone, findVoucherByLeadId, insertLead, insertVoucher } from "@/lib/store";
import {
  buildQrPayload,
  defaultExpiry,
  generateVoucherCode,
  isAdult,
  isValidPhone,
  newId,
  normalizePhone,
} from "@/lib/voucher";
import { glassById } from "@/lib/glasses";
import type { Lead, Voucher } from "@/lib/types";
import { sendVoucherEmail } from "@/lib/voucherEmail";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const rawPhone = String(body.phone ?? "").trim();
  const birth_date = String(body.birth_date ?? "").trim();
  const selected_glass = String(body.selected_glass ?? "").trim();
  const email = body.email ? String(body.email).trim() : null;
  const has_visited_before = body.has_visited_before
    ? String(body.has_visited_before)
    : null;

  // --- Validation ---
  if (name.length < 2) {
    return NextResponse.json({ error: "invalid_name" }, { status: 422 });
  }
  if (!isValidPhone(rawPhone)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 422 });
  }
  if (!birth_date || !isAdult(birth_date)) {
    return NextResponse.json({ error: "not_adult" }, { status: 422 });
  }
  if (!glassById(selected_glass)) {
    return NextResponse.json({ error: "invalid_glass" }, { status: 422 });
  }

  const phone = normalizePhone(rawPhone);

  async function buildQrDataUrl(payload: string) {
    return QRCode.toDataURL(payload, {
      margin: 1,
      width: 520,
      color: { dark: "#3f0a25", light: "#f7f9ea" },
    });
  }

  // --- One voucher per phone (re-show existing invite when already registered) ---
  const existing = await findLeadByPhone(phone);
  if (existing) {
    const existingVoucher = await findVoucherByLeadId(existing.id);
    if (existingVoucher) {
      try {
        const qrDataUrl = await buildQrDataUrl(existingVoucher.qr_payload);
        return NextResponse.json(
          { voucher: existingVoucher, lead: existing, qrDataUrl, reused: true },
          { status: 200 }
        );
      } catch (e) {
        return NextResponse.json(
          { error: "qr_failed", detail: String(e) },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: "phone_already_registered" },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();
  const lead: Lead = {
    id: newId(),
    name,
    phone,
    email,
    birth_date,
    has_visited_before,
    selected_glass,
    source: (body.source as string) ?? null,
    utm_source: (body.utm_source as string) ?? null,
    utm_medium: (body.utm_medium as string) ?? null,
    utm_campaign: (body.utm_campaign as string) ?? null,
    utm_content: (body.utm_content as string) ?? null,
    utm_term: (body.utm_term as string) ?? null,
    created_at: nowIso,
  };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin ||
    "http://localhost:3000";
  const code = generateVoucherCode();
  const voucher: Voucher = {
    id: newId(),
    lead_id: lead.id,
    voucher_code: code,
    qr_payload: buildQrPayload(code, siteUrl),
    selected_glass,
    status: "active",
    expires_at: defaultExpiry(),
    created_at: nowIso,
    redeemed_at: null,
    redeemed_by: null,
  };

  try {
    await insertLead(lead);
    await insertVoucher(voucher);
  } catch (e) {
    return NextResponse.json(
      { error: "persist_failed", detail: String(e) },
      { status: 500 }
    );
  }

  try {
    const qrDataUrl = await buildQrDataUrl(voucher.qr_payload);
    if (email) {
      void sendVoucherEmail({ to: email, lead, voucher, qrDataUrl });
    }
    return NextResponse.json({ voucher, lead, qrDataUrl }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "qr_failed", detail: String(e) },
      { status: 500 }
    );
  }
}
