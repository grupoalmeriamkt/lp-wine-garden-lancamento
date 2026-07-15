import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifyToken } from "@/lib/auth";

export const config = {
  matcher: [
    "/admin/:path*",
    "/operador/:path*",
    "/api/admin/:path*",
    // Ações sobre um voucher específico (resgatar/cancelar) — ver guard abaixo.
    // `:path+` exige ao menos um segmento, então NÃO cobre o POST público de
    // criação em `/api/voucher` (sem código).
    "/api/voucher/:path+",
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Páginas de login são públicas.
  if (pathname === "/admin/login" || pathname === "/operador/login") {
    return NextResponse.next();
  }

  // Resgatar/cancelar um voucher (POST /api/voucher/<code>) exige login de
  // operador OU admin. A consulta (GET) e a criação pública seguem abertas.
  if (pathname.startsWith("/api/voucher/")) {
    if (req.method !== "POST") return NextResponse.next();
    const adminOk = await verifyToken(req.cookies.get(COOKIE.admin)?.value, "admin");
    const operOk = await verifyToken(req.cookies.get(COOKIE.operator)?.value, "operator");
    if (adminOk || operOk) return NextResponse.next();
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isOperator = pathname.startsWith("/operador");
  const role = isOperator ? "operator" : "admin";
  const token = req.cookies.get(COOKIE[role])?.value;

  if (await verifyToken(token, role)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = isOperator ? "/operador/login" : "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}
