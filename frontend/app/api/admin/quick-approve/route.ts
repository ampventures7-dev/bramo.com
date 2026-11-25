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

// Secret token for 1-click mobile authorization (Co-Founder Prachii Pawar desk)
const ADMIN_APPROVE_SECRET = process.env.ADMIN_APPROVE_SECRET || "bhramo-prachii-approve-2026";

/**
 * GET /api/admin/quick-approve?id=BH-xxx&token=xxx
 * Allows Co-Founder Prachii Pawar to approve payments in 1 click from WhatsApp on mobile.
 * Returns a mobile-optimized HTML confirmation badge.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("id");
  const token = searchParams.get("token");

  // Validate security token
  if (!token || token !== ADMIN_APPROVE_SECRET) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Unauthorized · bhramo.com Admin Desk</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #FFF5F5; color: #9B1C1C; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: white; border: 1px solid #F87171; border-radius: 20px; padding: 32px; max-width: 420px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            h1 { font-size: 20px; margin-bottom: 8px; color: #991B1B; }
            p { font-size: 14px; color: #7F1D1D; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>❌ Access Denied</h1>
            <p>Invalid authorization token. This link can only be accessed via authorized admin channels.</p>
          </div>
        </body>
      </html>`,
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (!bookingId) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>Missing booking ID parameter.</h2></body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  let bookingRecord: any = null;

  // 1. Check in-memory store
  if (serverHolds.has(bookingId)) {
    bookingRecord = serverHolds.get(bookingId);
    serverHolds.set(bookingId, {
      ...bookingRecord,
      status: "confirmed",
      confirmedAt: Date.now(),
      confirmedBy: "prachii_quick_approve",
    });
  }

  // 2. Check and update Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (data) {
        bookingRecord = data;
        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookingId);
      }
    } catch (err) {
      console.warn("Supabase update in quick-approve warning:", err);
    }
  }

  const hotelName = bookingRecord?.hotelName || bookingRecord?.hotel_name || "Konkan Stay";
  const guestName = bookingRecord?.guestName || bookingRecord?.guest_name || "Guest";
  const guestPhone = bookingRecord?.guestPhone || bookingRecord?.guest_phone || "";
  const totalAmount = bookingRecord?.totalAmount || bookingRecord?.total_amount || 0;

  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
        <title>Booking Approved · bhramo.com Desk</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #0d5c52 0%, #064038 100%);
            color: #1e293b;
            min-height: 100vh;
            margin: 0;
            padding: 24px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card {
            background: #ffffff;
            border-radius: 28px;
            padding: 32px 24px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            text-align: center;
          }
          .badge {
            width: 64px;
            height: 64px;
            background: #ecfdf5;
            color: #059669;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin: 0 auto 16px;
            border: 2px solid #a7f3d0;
          }
          h1 {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 6px;
          }
          .sub {
            font-size: 13px;
            color: #059669;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 20px;
          }
          .details {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 18px;
            text-align: left;
            margin-bottom: 24px;
            font-size: 13px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dashed #e2e8f0;
          }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 500; }
          .val { color: #0f172a; font-weight: 700; }
          .btn-wa {
            display: block;
            background: #25d366;
            color: #ffffff;
            font-weight: 700;
            text-decoration: none;
            padding: 14px 20px;
            border-radius: 16px;
            font-size: 14px;
            transition: opacity 0.2s;
            margin-bottom: 10px;
          }
          .btn-dash {
            display: block;
            background: #0f766e;
            color: #ffffff;
            font-weight: 700;
            text-decoration: none;
            padding: 14px 20px;
            border-radius: 16px;
            font-size: 14px;
          }
          .footer-note {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 18px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">✓</div>
          <h1>Booking Approved!</h1>
          <div class="sub">Verified by Prachii Pawar</div>

          <div class="details">
            <div class="row">
              <span class="label">Booking ID:</span>
              <span class="val" style="font-family: monospace;">${bookingId}</span>
            </div>
            <div class="row">
              <span class="label">Property:</span>
              <span class="val">${hotelName}</span>
            </div>
            <div class="row">
              <span class="label">Primary Guest:</span>
              <span class="val">${guestName}</span>
            </div>
            ${guestPhone ? `
            <div class="row">
              <span class="label">Guest Phone:</span>
              <span class="val">${guestPhone}</span>
            </div>` : ""}
            ${totalAmount ? `
            <div class="row">
              <span class="label">Total Stay:</span>
              <span class="val">₹${totalAmount}</span>
            </div>` : ""}
          </div>

          <a href="https://wa.me/917447568595" class="btn-wa">
            💬 Return to WhatsApp Chat
          </a>

          <a href="/admin/bookings" class="btn-dash">
            📋 View in Admin Bookings
          </a>

          <div class="footer-note">
            bhramo.com Desk · Status automatically synchronized to guest voucher.
          </div>
        </div>
      </body>
    </html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
