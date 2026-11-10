import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("gh_session");

  // Protect private routes
  const isProtectedRoute =
    pathname.startsWith("/patient") ||
    pathname.startsWith("/frontdesk") ||
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/admin");

  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Security response headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/frontdesk/:path*",
    "/doctor/:path*",
    "/admin/:path*",
  ],
};
