import { NextRequest, NextResponse } from "next/server";
import { findVoucherByCode, updateVoucher } from "@/lib/store";

export const runtime = "nodejs";

/** GET — busca voucher por código e resolve status de expiração on-read. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const voucher = await findVoucherByCode(code);
  if (!voucher) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let status = voucher.status;
  if (status === "active" && new Date(voucher.expires_at) < new Date()) {
    status = "expired";
    await updateVoucher(code, { status });
  }

  return NextResponse.json({ voucher: { ...voucher, status } });
}

/** POST — ações: { action: "redeem" | "cancel", redeemed_by? } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  const voucher = await findVoucherByCode(code);
  if (!voucher) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (action === "redeem") {
    if (voucher.status === "redeemed") {
      return NextResponse.json({ error: "already_redeemed" }, { status: 409 });
    }
    if (new Date(voucher.expires_at) < new Date()) {
      await updateVoucher(code, { status: "expired" });
      return NextResponse.json({ error: "expired" }, { status: 409 });
    }
    if (voucher.status !== "active") {
      return NextResponse.json({ error: "not_active" }, { status: 409 });
    }
    const updated = await updateVoucher(code, {
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      redeemed_by: body.redeemed_by ? String(body.redeemed_by) : "staff",
    });
    return NextResponse.json({ voucher: updated });
  }

  if (action === "cancel") {
    const updated = await updateVoucher(code, { status: "cancelled" });
    return NextResponse.json({ voucher: updated });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
