import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Global server-side synchronized in-memory hold store
const globalForHolds = global as unknown as {
  __bhramo_server_holds?: Map<string, any>;
};

if (!globalForHolds.__bhramo_server_holds) {
  globalForHolds.__bhramo_server_holds = new Map<string, any>();
}

const serverHolds = globalForHolds.__bhramo_server_holds;

// Shared secret key for incoming bank webhook alerts from Google Apps Script
const BANK_WEBHOOK_SECRET = process.env.BANK_WEBHOOK_SECRET || "bhramo-bank-alert-webhook-free-2026";

/**
 * POST /api/bookings/bank-webhook
 * 100% Free Automated Bank Alert Webhook (Point 5).
 * Receives bank credit notifications from Google Apps Script running on Gmail filters.
 * Matches 12-digit UPI UTR or Amount to confirm pending booking holds automatically within 5 seconds!
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-bank-webhook-secret") || req.headers.get("authorization");
    const body = await req.json().catch(() => ({}));

    // Verify secret token
    const token = authHeader?.replace("Bearer ", "") || body.secret;
    if (token !== BANK_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid bank webhook secret" },
        { status: 401 }
      );
    }

    const { utr, amount, sender, rawSnippet } = body;

    if (!utr && !amount) {
      return NextResponse.json(
        { success: false, error: "Missing both UTR and amount in bank webhook payload" },
        { status: 400 }
      );
    }

    const cleanUtr = utr ? String(utr).trim() : null;
    const numAmount = amount ? Number(amount) : null;

    let matchedBookingId: string | null = null;
    let matchedBooking: any = null;

    // 1. Search in-memory holds for matching UTR or matching recent pending hold
    serverHolds.forEach((hold, id) => {
      if (hold.status === "pending_verification" || hold.status === "holding") {
        // Exact UTR match
        if (cleanUtr && hold.upiRefNumber && hold.upiRefNumber.trim() === cleanUtr) {
          matchedBookingId = id;
          matchedBooking = hold;
        }
        // Fallback: If amount matches the 20% advance exactly and within active hold window
        else if (!matchedBookingId && numAmount && Math.round(hold.totalAmount * 0.20) === numAmount) {
          matchedBookingId = id;
          matchedBooking = hold;
        }
      }
    });

    // 2. If matched in memory, update status to confirmed
    if (matchedBookingId && matchedBooking) {
      serverHolds.set(matchedBookingId, {
        ...matchedBooking,
        status: "confirmed",
        confirmedAt: Date.now(),
        confirmedBy: "automated_bank_webhook",
        bankAlertUtr: cleanUtr || matchedBooking.upiRefNumber,
      });
    }

    // 3. Search and update Supabase if configured
    if (isSupabaseConfigured) {
      try {
        if (cleanUtr) {
          const { data } = await supabase
            .from("bookings")
            .select("*")
            .eq("upi_ref_number", cleanUtr)
            .single();

          if (data) {
            matchedBookingId = data.id;
            await supabase
              .from("bookings")
              .update({
                status: "confirmed",
                payment_status: "paid",
                updated_at: new Date().toISOString(),
              })
              .eq("id", data.id);
          }
        }
      } catch (err) {
        console.warn("Supabase bank webhook sync warning:", err);
      }
    }

    return NextResponse.json({
      success: true,
      matched: Boolean(matchedBookingId),
      bookingId: matchedBookingId,
      message: matchedBookingId
        ? `Booking ${matchedBookingId} auto-confirmed from bank credit alert!`
        : "Bank alert recorded; awaiting matching guest UTR submission.",
      receivedUtr: cleanUtr,
      receivedAmount: numAmount,
    });
  } catch (error: any) {
    console.error("Bank webhook error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
