import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * Rate limit verification for authentication routes (login & signup)
 * POST /api/auth/rate-limit
 * Body: { action: "login" | "signup", identifier?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action === "signup" ? "signup" : "login";
    const ip = getClientIp(request);

    // Login: Max 5 attempts per 60 seconds
    // Signup: Max 3 attempts per 600 seconds (10 minutes)
    const limit = action === "signup" ? 3 : 5;
    const windowSeconds = action === "signup" ? 600 : 60;
    const key = `auth:${action}:${ip}`;

    const result = checkRateLimit(key, limit, windowSeconds);

    if (!result.success) {
      return NextResponse.json(
        {
          allowed: false,
          error: `RATE_LIMIT_EXCEEDED: Too many ${action} attempts from your network. Please wait ${result.resetSeconds} seconds.`,
          resetSeconds: result.resetSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": result.resetSeconds.toString(),
          },
        }
      );
    }

    return NextResponse.json({
      allowed: true,
      remaining: result.remaining,
      resetSeconds: result.resetSeconds,
    });
  } catch (e: any) {
    return NextResponse.json({ allowed: true });
  }
}
