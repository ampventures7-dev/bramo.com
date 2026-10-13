import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * Rate limit verification for booking reservation creation
 * POST /api/bookings/rate-limit
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    // Max 6 booking reservations per 10 minutes per IP
    const limit = 6;
    const windowSeconds = 600;
    const key = `booking:create:${ip}`;

    const result = checkRateLimit(key, limit, windowSeconds);

    if (!result.success) {
      return NextResponse.json(
        {
          allowed: false,
          error: `RATE_LIMIT_EXCEEDED: You have created multiple reservation holds recently. Please wait ${result.resetSeconds} seconds before creating another reservation.`,
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
