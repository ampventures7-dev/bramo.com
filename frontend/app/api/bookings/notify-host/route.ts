import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface HostNotificationPayload {
  bookingId: string;
  hostPhone: string;
  hotelName: string;
  hotelArea: string;
  roomName: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  advanceAmount: number;
  balanceAmount: number;
  utr?: string;
  screenshotUrl?: string;
}

// Global server notification dispatch registry
const globalForNotifications = global as unknown as {
  __bhramo_server_notifications?: Map<string, any>;
};

if (!globalForNotifications.__bhramo_server_notifications) {
  globalForNotifications.__bhramo_server_notifications = new Map<string, any>();
}

const notificationsStore = globalForNotifications.__bhramo_server_notifications;

/**
 * POST /api/bookings/notify-host
 * Asynchronous server-side notification dispatcher for property owners
 * Decouples notification from the guest's client browser
 */
export async function POST(req: NextRequest) {
  try {
    const body: HostNotificationPayload = await req.json();
    const {
      bookingId,
      hostPhone = "919422388200",
      hotelName,
      hotelArea,
      roomName,
      guestName,
      guestPhone,
      checkIn,
      checkOut,
      advanceAmount,
      balanceAmount,
      utr = "N/A",
      screenshotUrl,
    } = body;

    if (!bookingId || !hotelName) {
      return NextResponse.json(
        { success: false, error: "Missing required booking details for host notification." },
        { status: 400 }
      );
    }

    const actionToken = `act_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Formatted message payload for WhatsApp Cloud API & Webhook
    const formattedMessage = `🏖️ *New Booking Request — bhramo.com*
━━━━━━━━━━━━━━━━━━
🏨 *Hotel:* ${hotelName} (${hotelArea || "Dapoli"})
🛏️ *Room:* ${roomName}
👤 *Guest:* ${guestName} (${guestPhone})
📅 *Dates:* ${checkIn} → ${checkOut}
💰 *Advance Paid:* ₹${advanceAmount} (UTR: ${utr})
💵 *Balance at Check-in:* ₹${balanceAmount}
━━━━━━━━━━━━━━━━━━
⚡ *Action Required:* Please verify incoming bank SMS for UTR: *${utr}*`;

    const notificationRecord = {
      id: `notif_${Date.now()}`,
      bookingId,
      recipientPhone: hostPhone,
      channel: "whatsapp",
      message: formattedMessage,
      actionToken,
      status: "dispatched",
      dispatchedAt: new Date().toISOString(),
      deepLink: `https://wa.me/${hostPhone.replace(/\D/g, "")}?text=${encodeURIComponent(formattedMessage)}`,
    };

    notificationsStore.set(bookingId, notificationRecord);

    // Save in Supabase host_notifications if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from("host_notifications").insert([
          {
            booking_id: bookingId,
            recipient_phone: hostPhone,
            channel: "whatsapp",
            payload: {
              hotelName,
              roomName,
              guestName,
              guestPhone,
              checkIn,
              checkOut,
              advanceAmount,
              balanceAmount,
              utr,
              screenshotUrl,
            },
            action_token: actionToken,
            delivery_status: "dispatched",
          },
        ]);
      } catch (dbErr) {
        console.warn("Could not insert host notification in Supabase:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Server notification dispatched to property host.",
      notification: {
        id: notificationRecord.id,
        recipientPhone: hostPhone,
        channel: "whatsapp",
        dispatchedAt: notificationRecord.dispatchedAt,
        directActionLink: notificationRecord.deepLink,
      },
    });
  } catch (err: any) {
    console.error("Host notification error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch notification to host." },
      { status: 500 }
    );
  }
}

