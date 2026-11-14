import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Server-side registered UTR registry to prevent multi-device race conditions & fraud
const globalForUtr = global as unknown as {
  __bhramo_server_utrs?: Map<string, { bookingId: string; timestamp: number }>;
};

if (!globalForUtr.__bhramo_server_utrs) {
  globalForUtr.__bhramo_server_utrs = new Map<string, { bookingId: string; timestamp: number }>();
}

const serverUtrs = globalForUtr.__bhramo_server_utrs;

// Known fake / test UTR dummy sequences that fraud bots attempt
const FAKE_UTR_BLACKLIST = new Set([
  "000000000000",
  "111111111111",
  "222222222222",
  "333333333333",
  "444444444444",
  "555555555555",
  "666666666666",
  "777777777777",
  "888888888888",
  "999999999999",
  "123456789012",
  "012345678901",
]);

/**
 * POST /api/bookings/verify-utr
 * Validates 12-digit NPCI format & performs server-level anti-fraud deduplication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, utr, screenshotUrl } = body;

    if (!bookingId || !utr) {
      return NextResponse.json(
        { success: false, error: "Missing booking ID or UTR transaction reference." },
        { status: 400 }
      );
    }

    const cleanUtr = String(utr).trim();

    // 1. Strict 12-digit NPCI numeric validation
    if (!/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid UTR format: Indian UPI UTR / RRN must be exactly 12 numeric digits.",
        },
        { status: 422 }
      );
    }

    // 2. Reject blacklisted dummy numbers
    if (FAKE_UTR_BLACKLIST.has(cleanUtr)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid UTR: The provided reference number is a generic test sequence. Please enter the authentic 12-digit UTR from your bank or UPI app.",
        },
        { status: 422 }
      );
    }

    // 3. Check server-side in-memory registry for duplicates across all active sessions
    const existing = serverUtrs.get(cleanUtr);
    if (existing && existing.bookingId !== bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate UTR: This 12-digit transaction ID has already been submitted for another booking. Please check your bank receipt.",
        },
        { status: 409 }
      );
    }

    // 4. Check Supabase database if configured (ACID cross-database deduplication)
    if (isSupabaseConfigured) {
      try {
        const { data: duplicateBooking } = await supabase
          .from("bookings")
          .select("id, status")
          .eq("utr", cleanUtr)
          .neq("id", bookingId)
          .in("status", ["pending_verification", "confirmed"])
          .maybeSingle();

        if (duplicateBooking) {
          return NextResponse.json(
            {
              success: false,
              error: "Duplicate UTR: This 12-digit transaction ID has already been recorded in our reservation database.",
            },
            { status: 409 }
          );
        }

        // Call database RPC to transition booking status
        const { error: rpcError } = await supabase.rpc("submit_booking_upi", {
          p_booking_id: bookingId,
          p_utr: cleanUtr,
          p_screenshot_url: screenshotUrl || null,
        });

        if (rpcError) {
          const isDbDuplicate = rpcError.message?.includes("unique") || rpcError.message?.includes("duplicate");
          if (isDbDuplicate) {
            return NextResponse.json(
              {
                success: false,
                error: "Duplicate UTR: This 12-digit transaction ID has already been submitted.",
              },
              { status: 409 }
            );
          }
        }
      } catch (dbErr) {
        console.warn("Supabase UTR deduplication check fallback:", dbErr);
      }
    }

    // 5. Register UTR in server-side registry
    serverUtrs.set(cleanUtr, { bookingId, timestamp: Date.now() });

    const verificationExpiresAt = Date.now() + 45 * 60 * 1000; // 45-minute host verification window

    return NextResponse.json({
      success: true,
      bookingId,
      utr: cleanUtr,
      verificationExpiresAt,
      message: "UTR submitted successfully for host verification.",
    });
  } catch (err: any) {
    console.error("UTR verification error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify transaction." },
      { status: 500 }
    );
  }
}

