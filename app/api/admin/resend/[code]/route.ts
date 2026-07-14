import { NextRequest, NextResponse } from "next/server";
import {
  findLeadById,
  findVoucherByCode,
  insertEmailEvent,
} from "@/lib/store";
import { sendVoucherEmail } from "@/lib/mailer";
import { glassLabel } from "@/lib/glasses";
import { CAMPAIGN, VENUE } from "@/lib/config";
import { newId } from "@/lib/voucher";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const voucher = await findVoucherByCode(code);
  if (!voucher) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const lead = await findLeadById(voucher.lead_id);
  if (!lead?.email) {
    return NextResponse.json({ error: "no_email" }, { status: 422 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(
    /\/$/,
    ""
  );
  const r = await sendVoucherEmail(lead.email, {
    name: lead.name,
    glassName: glassLabel(voucher.selected_glass),
    code,
    validade: `${CAMPAIGN.courtesyPeriod.label} de 2026`,
    voucherUrl: voucher.qr_payload,
    qrUrl: `${base}/api/qr/${code}`,
    logoUrl: `${base}/brand/logo/wg-horizontal-bege.png`,
    mapsUrl: VENUE.mapsUrl,
  });

  if ("skipped" in r && r.skipped) {
    return NextResponse.json({ error: "email_not_configured" }, { status: 500 });
  }
  await insertEmailEvent({
    id: newId(),
    resend_id: "id" in r ? r.id ?? null : null,
    email: lead.email,
    voucher_code: code,
    type: "resent",
    created_at: new Date().toISOString(),
    raw: null,
  });
  return NextResponse.json({ ok: true });
}
