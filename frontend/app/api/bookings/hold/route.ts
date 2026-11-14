import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface ServerBookingHold {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelArea: string;
  roomTypeId: string;
  roomName: string;
  guestId?: string;
  guestName: string;
  guestPhone: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  roomsCount: number;
  guestsCount: number;
  totalAmount: number;
  status: "holding" | "pending_verification" | "confirmed" | "released" | "expired";
  holdExpiresAt: number; // ms timestamp
  createdAt: number;
}

// Global server-side synchronized in-memory hold store
// Shared across all concurrent connections and devices on this Next.js instance
const globalForHolds = global as unknown as {
  __bhramo_server_holds?: Map<string, ServerBookingHold>;
};

if (!globalForHolds.__bhramo_server_holds) {
  globalForHolds.__bhramo_server_holds = new Map<string, ServerBookingHold>();
}

const serverHolds = globalForHolds.__bhramo_server_holds;

// Auto-reaper: releases any hold that exceeded the 15-minute lease window
function reapExpiredServerHolds() {
  const now = Date.now();
  serverHolds.forEach((hold, id) => {
    if (hold.status === "holding" && hold.holdExpiresAt < now) {
      serverHolds.set(id, { ...hold, status: "expired" });
    }
  });
}

/**
 * GET /api/bookings/hold
 * Query hold by id, or check current active room holds for a date range
 */
export async function GET(req: NextRequest) {
  reapExpiredServerHolds();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const roomTypeId = searchParams.get("roomTypeId");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  // Fetch specific hold by ID
  if (id) {
    // 1. Check server in-memory store
    const hold = serverHolds.get(id);
    if (hold) {
      const now = Date.now();
      const isExpired = hold.status === "holding" && hold.holdExpiresAt < now;
      if (isExpired) {
        hold.status = "expired";
      }
      return NextResponse.json({ success: true, hold });
    }

    // 2. Check Supabase database if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            hotel_id,
            room_type_id,
            guest_id,
            check_in,
            check_out,
            rooms_count,
            guests,
            total_amount,
            status,
            hold_expires_at,
            created_at,
            utr,
            hotels:hotel_id (name, area),
            room_types:room_type_id (name),
            profiles:guest_id (name, phone)
          `)
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          const hotelData = (data as any).hotels;
          const roomData = (data as any).room_types;
          const profileData = (data as any).profiles;

          const serverRecord: ServerBookingHold = {
            id: data.id,
            hotelId: data.hotel_id,
            hotelName: hotelData?.name || "Coastal Stay",
            hotelArea: hotelData?.area || "Dapoli",
            roomTypeId: data.room_type_id,
            roomName: roomData?.name || "Standard Room",
            guestId: data.guest_id || undefined,
            guestName: profileData?.name || "Guest",
            guestPhone: profileData?.phone || "",
            checkIn: data.check_in,
            checkOut: data.check_out,
            roomsCount: data.rooms_count || 1,
            guestsCount: data.guests || 1,
            totalAmount: Number(data.total_amount),
            status: data.status as any,
            holdExpiresAt: data.hold_expires_at ? new Date(data.hold_expires_at).getTime() : Date.now() + 15 * 60 * 1000,
            createdAt: new Date(data.created_at).getTime(),
          };

          serverHolds.set(data.id, serverRecord);
          return NextResponse.json({ success: true, hold: serverRecord });
        }
      } catch (err) {
        console.warn("Error fetching booking from Supabase:", err);
      }
    }

    return NextResponse.json({ success: false, error: "Hold not found or expired" }, { status: 404 });
  }

  // Check active holds count for dates
  if (roomTypeId && checkIn && checkOut) {
    const now = Date.now();
    let totalHeldRooms = 0;

    serverHolds.forEach((hold) => {
      if (
        hold.roomTypeId === roomTypeId &&
        (hold.status === "holding" || hold.status === "pending_verification") &&
        hold.holdExpiresAt > now
      ) {
        // Date overlap check: (StartA < EndB) and (EndA > StartB)
        if (hold.checkIn < checkOut && hold.checkOut > checkIn) {
          totalHeldRooms += hold.roomsCount;
        }
      }
    });

    return NextResponse.json({
      success: true,
      roomTypeId,
      checkIn,
      checkOut,
      activeHeldRooms: totalHeldRooms,
    });
  }

  return NextResponse.json({ success: false, error: "Missing required query parameters" }, { status: 400 });
}

/**
 * POST /api/bookings/hold
 * Atomically creates a 15-minute lease hold on room inventory
 */
export async function POST(req: NextRequest) {
  try {
    reapExpiredServerHolds();

    const body = await req.json();
    const {
      hotelId,
      hotelName,
      hotelArea,
      roomTypeId,
      roomName,
      guestId,
      guestName,
      guestPhone,
      checkIn,
      checkOut,
      roomsCount = 1,
      guestsCount = 2,
      totalAmount,
    } = body;

    // Validate inputs
    if (!hotelId || !roomTypeId || !checkIn || !checkOut || !guestName || !guestPhone) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS: All booking parameters are required." },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (checkIn < todayStr) {
      return NextResponse.json(
        { success: false, error: "PAST_DATE: Check-in date cannot be in the past." },
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        { success: false, error: "INVALID_DATES: Check-out must be at least 1 night after check-in." },
        { status: 400 }
      );
    }

    const bookingId = `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const holdDurationMs = 15 * 60 * 1000; // 15-minute enterprise hold lease
    const holdExpiresAt = Date.now() + holdDurationMs;

    // 1. Try Supabase Atomic Transaction first if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc("acquire_atomic_hold", {
          p_booking_id: bookingId,
          p_hotel_id: hotelId,
          p_room_type_id: roomTypeId,
          p_check_in: checkIn,
          p_check_out: checkOut,
          p_rooms_count: roomsCount,
          p_guests_count: guestsCount,
          p_total_amount: totalAmount,
          p_guest_id: guestId || null,
          p_guest_name: guestName,
          p_guest_phone: guestPhone,
        });

        if (error) {
          console.warn("acquire_atomic_hold RPC failed, evaluating local lock:", error);
        } else if (data && !data.success) {
          return NextResponse.json({ success: false, error: data.error }, { status: 409 });
        } else if (data && data.success) {
          const expiresMs = new Date(data.hold_expires_at).getTime();
          const holdRecord: ServerBookingHold = {
            id: bookingId,
            hotelId,
            hotelName,
            hotelArea,
            roomTypeId,
            roomName,
            guestId,
            guestName,
            guestPhone,
            checkIn,
            checkOut,
            roomsCount,
            guestsCount,
            totalAmount,
            status: "holding",
            holdExpiresAt: expiresMs,
            createdAt: Date.now(),
          };
          serverHolds.set(bookingId, holdRecord);

          return NextResponse.json({
            success: true,
            bookingId,
            holdExpiresAt: expiresMs,
            source: "supabase_rpc",
          });
        }
      } catch (rpcErr) {
        console.warn("Supabase RPC execution error, falling back to server lock:", rpcErr);
      }
    }

    // 2. Server-side in-memory atomic lock (shared across all devices connected to this server)
    const now = Date.now();
    let currentHeld = 0;
    serverHolds.forEach((existing) => {
      if (
        existing.roomTypeId === roomTypeId &&
        (existing.status === "holding" || existing.status === "pending_verification") &&
        existing.holdExpiresAt > now
      ) {
        if (existing.checkIn < checkOut && existing.checkOut > checkIn) {
          currentHeld += existing.roomsCount;
        }
      }
    });

    const defaultRoomCapacity = 5;
    const remainingRooms = Math.max(0, defaultRoomCapacity - currentHeld);

    if (remainingRooms < roomsCount) {
      return NextResponse.json(
        {
          success: false,
          error: `SOLD_OUT: This room is no longer available for your dates. (${remainingRooms} remaining, another traveler holds this room).`,
        },
        { status: 409 }
      );
    }

    const holdRecord: ServerBookingHold = {
      id: bookingId,
      hotelId,
      hotelName,
      hotelArea,
      roomTypeId,
      roomName,
      guestId,
      guestName,
      guestPhone,
      checkIn,
      checkOut,
      roomsCount,
      guestsCount,
      totalAmount,
      status: "holding",
      holdExpiresAt,
      createdAt: Date.now(),
    };

    serverHolds.set(bookingId, holdRecord);

    return NextResponse.json({
      success: true,
      bookingId,
      holdExpiresAt,
      source: "server_lock",
    });
  } catch (err: any) {
    console.error("Error creating booking hold:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error during reservation hold." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/hold
 * Releases an active hold when user cancels or abandons checkout
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Missing booking ID" }, { status: 400 });
    }

    const hold = serverHolds.get(bookingId);
    if (hold) {
      serverHolds.set(bookingId, { ...hold, status: "released" });
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("booking_holds")
          .update({ status: "released" })
          .eq("booking_id", bookingId);
      } catch (err) {
        console.warn("Error releasing hold in Supabase:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Hold released successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
