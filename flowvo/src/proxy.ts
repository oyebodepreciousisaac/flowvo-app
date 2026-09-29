import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
];

// Route prefixes that are always public (e.g. /reset-password/[token], /enquiry/[slug], /q/[token], /unsubscribe/[token])
const PUBLIC_PREFIXES = [
  "/reset-password/",
  "/enquiry/",
  "/q/",
  "/invoices/view/",
  "/unsubscribe/",
  "/api/enquiry/",
  "/api/auth/",
  "/api/cron/",
  "/api/webhooks/",
  "/api/health",
  "/_next/",
  "/favicon",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  // Public customer quote actions
  if (
    pathname.startsWith("/api/quotes/") &&
    (pathname.endsWith("/accept") || pathname.endsWith("/decline"))
  ) {
    return true;
  }
  // Public customer invoice print/PDF view
  if (pathname.startsWith("/invoices/") && pathname.endsWith("/print")) {
    return true;
  }
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("flowvo_session")?.value;

  if (!sessionToken) {
    // API routes must return JSON 401, never HTML redirect per spec
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
