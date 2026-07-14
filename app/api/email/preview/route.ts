import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { buildVoucherEmailHtml } from "@/lib/email";
import { VENUE, CAMPAIGN } from "@/lib/config";
import { buildQrPayload } from "@/lib/voucher";

export const runtime = "nodejs";

/**
 * Preview do e-mail de confirmação — abra no navegador para revisar o template
 * ANTES de habilitar o disparo real. Aceita ?name= &glass= &code=.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const name = q.get("name") || "Marina Almeida";
  const glassName = q.get("glass") || "Espumante";
  const code = q.get("code") || "WG-7KP4-9QX2";

  // Logo precisa carregar do host que está servindo o preview.
  const assetOrigin = req.nextUrl.origin;
  // Link do convite usa a URL canônica quando definida.
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const voucherUrl = buildQrPayload(code, origin);
  const qrDataUrl = await QRCode.toDataURL(voucherUrl, {
    margin: 1,
    width: 320,
    color: { dark: "#3f0a25", light: "#f7f9ea" },
  });

  const html = buildVoucherEmailHtml({
    name,
    glassName,
    code,
    validade: `${CAMPAIGN.courtesyPeriod.label} de 2026`,
    voucherUrl,
    qrDataUrl,
    logoUrl: `${assetOrigin}/brand/logo/wg-horizontal-bege.png`,
    mapsUrl: VENUE.mapsUrl,
  });

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
