import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_SECRET = "kti_skagara_secure_session_token_2026";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("admin_session");
  const isAuthenticated = session?.value === SESSION_SECRET;

  // Allow login page, static files, and _next internal requests
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    // If already authenticated and trying to access /login, redirect to dashboard /
    if (pathname.startsWith("/login") && isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated, redirect to /login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
