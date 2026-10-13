import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Middleware for Security Headers & Route Guarding
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Add Edge Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 2. Sensitive Route Monitoring & Protection
  // If accessing /admin or /owner in production with configured Supabase,
  // verify presence of session cookie
  const isProtectedAdmin = pathname.startsWith("/admin");
  const isProtectedOwner = pathname.startsWith("/owner");

  if (isProtectedAdmin || isProtectedOwner) {
    // Check for Supabase session cookies (starts with sb-)
    const cookies = request.cookies.getAll();
    const hasSupabaseSession = cookies.some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
    const hasCustomAuthCookie = request.cookies.has("bhramo_session");

    // In production without any session token and if Supabase is fully configured:
    const isProd = process.env.NODE_ENV === "production";
    const hasSupabaseConfig =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project-id.supabase.co";

    if (isProd && hasSupabaseConfig && !hasSupabaseSession && !hasCustomAuthCookie) {
      // In production with live DB, redirect unauthenticated users to /login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, banners, icons
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
