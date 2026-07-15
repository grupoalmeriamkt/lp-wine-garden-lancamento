import { NextRequest, NextResponse } from "next/server";
import { findVoucherByCode, updateVoucher } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const voucher = await findVoucherByCode(code);
  if (!voucher) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (action === "cancel") {
    const v = await updateVoucher(code, { status: "cancelled" });
    return NextResponse.json({ voucher: v });
  }
  if (action === "reactivate") {
    const v = await updateVoucher(code, {
      status: "active",
      redeemed_at: null,
      redeemed_by: null,
    });
    return NextResponse.json({ voucher: v });
  }
  if (action === "redeem") {
    const v = await updateVoucher(code, {
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      redeemed_by: "admin",
    });
    return NextResponse.json({ voucher: v });
  }
  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
