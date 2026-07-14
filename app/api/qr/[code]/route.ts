import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { buildQrPayload } from "@/lib/voucher";

export const runtime = "nodejs";

/**
 * QR Code do convite como PNG hospedado (clientes de e-mail — Gmail incluso —
 * bloqueiam data: URIs, mas carregam imagens https). Usado no e-mail e onde
 * mais precisar de um QR estável por código.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const safe = code.replace(/[^A-Za-z0-9-]/g, "").slice(0, 32);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

  const png = await QRCode.toBuffer(buildQrPayload(safe, origin), {
    type: "png",
    margin: 1,
    width: 600,
    color: { dark: "#3f0a25", light: "#f7f9ea" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
