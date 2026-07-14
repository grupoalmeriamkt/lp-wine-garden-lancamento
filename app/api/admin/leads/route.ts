import { NextRequest, NextResponse } from "next/server";
import {
  findLeadByCpf,
  findLeadByPhone,
  insertEmailEvent,
  insertLead,
  insertVoucher,
} from "@/lib/store";
import {
  buildQrPayload,
  defaultExpiry,
  generateVoucherCode,
  isAdult,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  newId,
  normalizeCpf,
  normalizePhone,
} from "@/lib/voucher";
import { glassById, glassLabel } from "@/lib/glasses";
import { CAMPAIGN, VENUE } from "@/lib/config";
import type { Lead, Voucher } from "@/lib/types";
import { sendVoucherEmail } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const rawPhone = String(body.phone ?? "").trim();
  const rawCpf = String(body.cpf ?? "").trim();
  const birth_date = String(body.birth_date ?? "").trim();
  const selected_glass = String(body.selected_glass ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (name.length < 2) return NextResponse.json({ error: "invalid_name" }, { status: 422 });
  if (!isValidPhone(rawPhone)) return NextResponse.json({ error: "invalid_phone" }, { status: 422 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "invalid_email" }, { status: 422 });
  if (!isValidCpf(rawCpf)) return NextResponse.json({ error: "invalid_cpf" }, { status: 422 });
  if (!birth_date || !isAdult(birth_date)) return NextResponse.json({ error: "not_adult" }, { status: 422 });
  if (!glassById(selected_glass)) return NextResponse.json({ error: "invalid_glass" }, { status: 422 });

  const phone = normalizePhone(rawPhone);
  const cpf = normalizeCpf(rawCpf);
  if (await findLeadByPhone(phone)) return NextResponse.json({ error: "phone_already_registered" }, { status: 409 });
  if (await findLeadByCpf(cpf)) return NextResponse.json({ error: "cpf_already_registered" }, { status: 409 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const nowIso = new Date().toISOString();
  const lead: Lead = {
    id: newId(), name, phone, cpf, email, birth_date,
    has_visited_before: body.has_visited_before ? String(body.has_visited_before) : null,
    selected_glass, source: "admin",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null,
    created_at: nowIso,
  };
  const code = generateVoucherCode();
  const voucher: Voucher = {
    id: newId(), lead_id: lead.id, voucher_code: code,
    qr_payload: buildQrPayload(code, siteUrl), selected_glass,
    status: "active", expires_at: defaultExpiry(), created_at: nowIso,
    redeemed_at: null, redeemed_by: null,
  };
  await insertLead(lead);
  await insertVoucher(voucher);

  const base = siteUrl.replace(/\/$/, "");
  const r = await sendVoucherEmail(email, {
    name, glassName: glassLabel(selected_glass), code,
    validade: `${CAMPAIGN.courtesyPeriod.label} de 2026`,
    voucherUrl: voucher.qr_payload, qrUrl: `${base}/api/qr/${code}`,
    logoUrl: `${base}/brand/logo/wg-horizontal-bege.png`, mapsUrl: VENUE.mapsUrl,
  }).catch(() => null);
  if (r && "id" in r && r.id) {
    await insertEmailEvent({
      id: newId(), resend_id: r.id, email, voucher_code: code,
      type: "sent", created_at: new Date().toISOString(), raw: null,
    });
  }
  return NextResponse.json({ lead, voucher }, { status: 201 });
}
