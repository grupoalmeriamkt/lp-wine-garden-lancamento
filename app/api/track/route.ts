import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Endpoint de tracking server-side. Em produção, encaminhe para
 * o CRM / data warehouse. Aqui apenas registramos no log do server.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { event, payload } = body ?? {};
  if (!event) {
    return NextResponse.json({ error: "missing_event" }, { status: 400 });
  }
  // eslint-disable-next-line no-console
  console.log(`[track] ${event}`, JSON.stringify(payload ?? {}));
  return NextResponse.json({ ok: true });
}
