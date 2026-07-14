import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifyToken } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/operador/:path*", "/api/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Páginas de login são públicas.
  if (pathname === "/admin/login" || pathname === "/operador/login") {
    return NextResponse.next();
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
