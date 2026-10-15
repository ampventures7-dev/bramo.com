import { NextResponse } from "next/server";
import {
  checkRateLimit,
  checkRateLimitStatus,
  recordFailedAttempt,
  resetRateLimit,
  getClientIp,
} from "@/lib/rate-limiter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getAdminUsers } from "@/lib/admin-service";

export const dynamic = "force-dynamic";

/**
 * Helper to determine if an identifier (email or phone) belongs to an owner
 */
async function isOwnerAccount(identifier?: string, roleHint?: string): Promise<boolean> {
  if (roleHint === "owner") return true;
  if (!identifier) return false;

  const clean = identifier.trim().toLowerCase();

  // 1. Check local admin service mock directory
  try {
    const adminUsers = getAdminUsers();
    const found = adminUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === clean) ||
        (u.phone && u.phone.replace(/\D/g, "") === clean.replace(/\D/g, ""))
    );
    if (found?.role === "owner") return true;
  } catch {
    // ignore
  }

  // 2. Check Supabase profiles table if configured
  if (isSupabaseConfigured) {
    try {
      const isEmail = clean.includes("@");
      let query = supabase.from("profiles").select("role");
      if (isEmail) {
        // Query by email in auth metadata or matching profiles
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .ilike("name", `%${clean.split("@")[0]}%`)
          .limit(1);
        if (data && data[0]?.role === "owner") return true;
      } else {
        const cleanPhone = clean.replace(/\D/g, "");
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("phone", cleanPhone)
          .limit(1);
        if (data && data[0]?.role === "owner") return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Authentication Rate Limiter
 * - Hotel Owners: Max 3 failed attempts (1 hour lockout)
 * - Guests / Regular Users: Max 5 failed attempts (1 hour lockout)
 * - Signups: Max 3 signups per 10 minutes per IP
 *
 * POST /api/auth/rate-limit
 * Body: {
 *   action: "check_login" | "record_failure" | "reset" | "signup",
 *   identifier?: string, // email or phone
 *   role?: "owner" | "guest"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || "check_login";
    const identifier = body.identifier ? body.identifier.trim().toLowerCase() : "";
    const ip = getClientIp(request);

    // Signup protection: 3 signups per 10 minutes (600s)
    if (action === "signup") {
      const signupKey = `signup:${ip}`;
      const result = checkRateLimit(signupKey, 3, 600);
      if (!result.success) {
        return NextResponse.json(
          {
            allowed: false,
            error: `Too many signup attempts from your network. Please wait ${Math.ceil(result.resetSeconds / 60)} minutes.`,
            resetSeconds: result.resetSeconds,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ allowed: true, remaining: result.remaining });
    }

    // Determine account tier: Owner (3 attempts) vs Guest (5 attempts)
    const isOwner = await isOwnerAccount(identifier, body.role);
    const maxAttempts = isOwner ? 3 : 5;
    const lockoutSeconds = 3600; // 1 Hour Lockout

    // Scope key to identifier + IP to protect against distributed brute force & shared Wi-Fi
    const authKey = identifier
      ? `auth:${isOwner ? "owner" : "guest"}:${identifier}`
      : `auth:${isOwner ? "owner" : "guest"}:${ip}`;

    // Action 1: Reset failed attempts upon successful login
    if (action === "reset") {
      resetRateLimit(authKey);
      return NextResponse.json({ success: true, message: "Rate limit reset" });
    }

    // Action 2: Check if currently locked before attempting login
    if (action === "check_login") {
      const status = checkRateLimitStatus(authKey, maxAttempts);
      if (status.isLocked) {
        const minutesLeft = Math.ceil(status.resetSeconds / 60);
        return NextResponse.json(
          {
            allowed: false,
            isLocked: true,
            maxAttempts,
            remaining: 0,
            resetSeconds: status.resetSeconds,
            error: `Account locked due to ${maxAttempts} consecutive failed login attempts (${isOwner ? "Hotel Owner" : "Guest"} policy). Please wait ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""} (1 hour total) before trying again.`,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({
        allowed: true,
        isLocked: false,
        maxAttempts,
        remaining: status.remaining,
      });
    }

    // Action 3: Record a failed password / OTP attempt
    if (action === "record_failure") {
      const failureResult = recordFailedAttempt(authKey, maxAttempts, lockoutSeconds);

      if (failureResult.isLocked) {
        const minutesLeft = Math.ceil(failureResult.resetSeconds / 60);
        return NextResponse.json(
          {
            allowed: false,
            isLocked: true,
            maxAttempts,
            remaining: 0,
            resetSeconds: failureResult.resetSeconds,
            error: `Security Lockout Triggered: Maximum ${maxAttempts} failed login attempts reached for this ${isOwner ? "Hotel Owner" : "Guest"} account. For security, please wait 1 hour (${minutesLeft} minutes remaining) before attempting to log in again.`,
          },
          { status: 429 }
        );
      }

      return NextResponse.json({
        allowed: true,
        isLocked: false,
        maxAttempts,
        remaining: failureResult.remaining,
        message: `Incorrect credentials. ${failureResult.remaining} of ${maxAttempts} attempt${failureResult.remaining === 1 ? "" : "s"} remaining before a 1-hour security lockout.`,
      });
    }

    return NextResponse.json({ allowed: true });
  } catch (err: any) {
    return NextResponse.json({ allowed: true, error: err.message });
  }
}
