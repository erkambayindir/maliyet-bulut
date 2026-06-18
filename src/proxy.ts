import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me";
const secretKey = new TextEncoder().encode(SESSION_SECRET);
const COOKIE_NAME = "mb_session";

// Oturum gerektirmeyen yollar
const PUBLIC_PATHS = ["/giris", "/kayit"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Statik/dahili ve auth API'lerini atla
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // dosyalar (favicon, svg vb.)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey);
      valid = true;
    } catch {
      valid = false;
    }
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Giriş yapmamış + korumalı sayfa → /giris
  if (!valid && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Giriş yapmış + login/kayıt sayfası → ana sayfa
  if (valid && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
