import { NextRequest, NextResponse } from "next/server";
import { COOKIE, passwordFor, Role, signRole } from "@/lib/auth";

export const runtime = "nodejs";

function parseRole(v: string): Role | null {
  return v === "admin" || v === "operator" ? v : null;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  const role = parseRole((await params).role);
  if (!role) return NextResponse.json({ error: "bad_role" }, { status: 404 });

  const expected = passwordFor(role);
  if (!expected) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  if (!safeEqual(String(body.password ?? ""), expected)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE[role], await signRole(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  const role = parseRole((await params).role);
  if (!role) return NextResponse.json({ error: "bad_role" }, { status: 404 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE[role], "", { path: "/", maxAge: 0 });
  return res;
}
