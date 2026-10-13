import { format, isBefore, startOfToday, addDays, differenceInCalendarDays } from "date-fns";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { RoomType } from "@/types/supabase";

export interface NightDetail {
  date: string;
  isWeekend: boolean; // Friday (5) or Saturday (6)
  rate: number;
}

export interface PriceCalculationResult {
  nights: number;
  weekdayNights: number;
  weekendNights: number;
  totalWeekdayCost: number;
  totalWeekendCost: number;
  baseRoomCost: number;
  extraGuestsCount: number;
  extraGuestCostPerNight: number;
  totalExtraGuestCost: number;
  effectiveNightlyRate: number;
  totalAmount: number;
  nightDetails: NightDetail[];
}

export interface BookingHoldRecord {
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
  paymentMethod?: "pay_at_hotel" | "upi_qr";
  upiRefNumber?: string;
  status: "requested" | "confirmed" | "cancelled";
  holdExpiresAt: number; // Unix timestamp in ms
  createdAt: number;
}

// Local in-memory / persistent hold store
const LOCAL_HOLDS_KEY = "bhramo_active_booking_holds";

function getLocalHolds(): BookingHoldRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_HOLDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHolds(holds: BookingHoldRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_HOLDS_KEY, JSON.stringify(holds));
  } catch {
    // ignore
  }
}

/**
 * 1. Calculate price considering weekend rate (Friday & Saturday nights)
 *    and comparative price increase as number of guests increases.
 */
export function calculatePriceWithWeekends(
  basePrice: number,
  weekendPrice: number,
  checkIn: Date,
  checkOut: Date,
  roomsCount: number = 1,
  guestsCount: number = 2,
  bedsCount: number = 1,
  customExtraGuestFee?: number
): PriceCalculationResult {
  const diffDays = differenceInCalendarDays(checkOut, checkIn);
  if (diffDays <= 0) {
    return {
      nights: 0,
      weekdayNights: 0,
      weekendNights: 0,
      totalWeekdayCost: 0,
      totalWeekendCost: 0,
      baseRoomCost: 0,
      extraGuestsCount: 0,
      extraGuestCostPerNight: 0,
      totalExtraGuestCost: 0,
      effectiveNightlyRate: basePrice,
      totalAmount: 0,
      nightDetails: [],
    };
  }
  const nights = diffDays;
  let weekdayNights = 0;
  let weekendNights = 0;
  let totalWeekdayCost = 0;
  let totalWeekendCost = 0;
  const nightDetails: NightDetail[] = [];

  for (let i = 0; i < nights; i++) {
    const currDate = addDays(checkIn, i);
    const dayOfWeek = currDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    const rate = isWeekend ? weekendPrice : basePrice;

    if (isWeekend) {
      weekendNights++;
      totalWeekendCost += rate * roomsCount;
    } else {
      weekdayNights++;
      totalWeekdayCost += rate * roomsCount;
    }

    nightDetails.push({
      date: format(currDate, "yyyy-MM-dd"),
      isWeekend,
      rate,
    });
  }

  const baseRoomCost = totalWeekdayCost + totalWeekendCost;

  // Base occupancy covered by the room base rate:
  // For standard 1-bed room: base rate covers 1 guest per room (2nd guest increases rate comparatively)
  // For 2-bed room: base rate covers 2 guests per room (3rd and 4th guests increase rate comparatively)
  const baseCoveredGuestsPerRoom = bedsCount === 2 ? 2 : 1;
  const totalBaseCoveredGuests = baseCoveredGuestsPerRoom * roomsCount;

  // Comparative extra guest charge per additional guest per night:
  // Default: ~₹400/night for 1-bed room or ₹500/night for 2-bed room if not specified
  const extraGuestFeePerNight = customExtraGuestFee !== undefined
    ? customExtraGuestFee
    : bedsCount === 2 ? 500 : 400;

  const extraGuestsCount = Math.max(0, guestsCount - totalBaseCoveredGuests);
  const totalExtraGuestCost = extraGuestsCount * extraGuestFeePerNight * nights;

  const totalAmount = baseRoomCost + totalExtraGuestCost;
  const effectiveNightlyRate = Math.round(totalAmount / (nights * roomsCount));

  return {
    nights,
    weekdayNights,
    weekendNights,
    totalWeekdayCost,
    totalWeekendCost,
    baseRoomCost,
    extraGuestsCount,
    extraGuestCostPerNight: extraGuestFeePerNight,
    totalExtraGuestCost,
    effectiveNightlyRate,
    totalAmount,
    nightDetails,
  };
}

/**
 * 2. Check room availability & handle errors (past dates, invalid dates, sold out)
 */
export async function checkRoomAvailability(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  roomsCount: number = 1
): Promise<{ available: boolean; error?: string; remainingRooms?: number }> {
  const today = startOfToday();

  // Validate past dates
  if (isBefore(checkIn, today)) {
    return {
      available: false,
      error: "PAST_DATE: Check-in date cannot be in the past.",
    };
  }

  // Validate check-out is after check-in
  if (!isBefore(checkIn, checkOut)) {
    return {
      available: false,
      error: "INVALID_DATES: Check-out date must be at least 1 day after check-in.",
    };
  }

  if (isSupabaseConfigured) {
    try {
      // Query availability table for date range
      const startDateStr = format(checkIn, "yyyy-MM-dd");
      const endDateStr = format(checkOut, "yyyy-MM-dd");

      const { data: rows, error } = await supabase
        .from("availability")
        .select("date, rooms_available")
        .eq("room_type_id", roomTypeId)
        .gte("date", startDateStr)
        .lt("date", endDateStr);

      if (!error) {
        if (rows && rows.length > 0) {
          let minRemaining = 999;
          for (const row of rows) {
            minRemaining = Math.min(minRemaining, row.rooms_available);
            if (row.rooms_available < roomsCount) {
              return {
                available: false,
                error: `SOLD_OUT: No rooms available for ${row.date}. Only ${row.rooms_available} remaining.`,
                remainingRooms: row.rooms_available,
              };
            }
          }
          return { available: true, remainingRooms: minRemaining };
        }
        // If no rows found yet for future dates, default rooms are available in full
        return { available: true, remainingRooms: 5 };
      }
    } catch (e) {
      console.warn("Availability check fallback:", e);
    }
  }

  // Check against active local holds
  const holds = getLocalHolds();
  const now = Date.now();
  const activeHoldsForRoom = holds.filter(
    (h) => h.roomTypeId === roomTypeId && h.status === "requested" && h.holdExpiresAt > now
  );

  const roomsHeld = activeHoldsForRoom.reduce((sum, h) => sum + h.roomsCount, 0);
  const defaultTotalRooms = 5;
  const remaining = Math.max(0, defaultTotalRooms - roomsHeld);

  if (remaining < roomsCount) {
    return {
      available: false,
      error: `SOLD_OUT: All rooms are currently booked or on hold for these dates (${remaining} left).`,
      remainingRooms: remaining,
    };
  }

  return {
    available: true,
    remainingRooms: remaining,
  };
}

/**
 * 3. Create booking with 10-minute hold window in an atomic transaction
 */
export async function createBookingHold(params: {
  hotelId: string;
  hotelName: string;
  hotelArea: string;
  roomType: RoomType;
  guestName: string;
  guestPhone: string;
  guestId?: string;
  checkIn: Date;
  checkOut: Date;
  roomsCount: number;
  guestsCount: number;
  totalAmount: number;
}): Promise<{ success: boolean; bookingId: string; holdExpiresAt: number; error?: string }> {
  // Verify availability first
  const avail = await checkRoomAvailability(
    params.roomType.id,
    params.checkIn,
    params.checkOut,
    params.roomsCount
  );

  if (!avail.available) {
    return {
      success: false,
      bookingId: "",
      holdExpiresAt: 0,
      error: avail.error || "Rooms not available for selected dates.",
    };
  }

  const holdDurationMs = 10 * 60 * 1000; // 10 minutes
  const holdExpiresAt = Date.now() + holdDurationMs;
  const bookingId = `bk-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc("create_booking_hold", {
        p_guest_id: params.guestId || null,
        p_hotel_id: params.hotelId,
        p_room_type_id: params.roomType.id,
        p_check_in: format(params.checkIn, "yyyy-MM-dd"),
        p_check_out: format(params.checkOut, "yyyy-MM-dd"),
        p_rooms_count: params.roomsCount,
        p_guests: params.guestsCount,
        p_total_amount: params.totalAmount,
        p_payment_method: "pending",
      });

      if (!error && data?.booking_id) {
        // Sync local record for seamless UI experience
        const record: BookingHoldRecord = {
          id: data.booking_id,
          hotelId: params.hotelId,
          hotelName: params.hotelName,
          hotelArea: params.hotelArea,
          roomTypeId: params.roomType.id,
          roomName: params.roomType.name,
          guestId: params.guestId,
          guestName: params.guestName,
          guestPhone: params.guestPhone,
          checkIn: format(params.checkIn, "yyyy-MM-dd"),
          checkOut: format(params.checkOut, "yyyy-MM-dd"),
          roomsCount: params.roomsCount,
          guestsCount: params.guestsCount,
          totalAmount: params.totalAmount,
          status: "requested",
          holdExpiresAt: new Date(data.hold_expires_at).getTime(),
          createdAt: Date.now(),
        };
        const currentHolds = getLocalHolds();
        saveLocalHolds([...currentHolds, record]);

        return {
          success: true,
          bookingId: data.booking_id,
          holdExpiresAt: record.holdExpiresAt,
        };
      }
    } catch (e) {
      console.warn("Supabase create_booking_hold fallback:", e);
    }
  }

  // Local hold creation (works 100% offline and in preview)
  const localRecord: BookingHoldRecord = {
    id: bookingId,
    hotelId: params.hotelId,
    hotelName: params.hotelName,
    hotelArea: params.hotelArea,
    roomTypeId: params.roomType.id,
    roomName: params.roomType.name,
    guestId: params.guestId,
    guestName: params.guestName,
    guestPhone: params.guestPhone,
    checkIn: format(params.checkIn, "yyyy-MM-dd"),
    checkOut: format(params.checkOut, "yyyy-MM-dd"),
    roomsCount: params.roomsCount,
    guestsCount: params.guestsCount,
    totalAmount: params.totalAmount,
    status: "requested",
    holdExpiresAt,
    createdAt: Date.now(),
  };

  const currentHolds = getLocalHolds();
  saveLocalHolds([...currentHolds, localRecord]);

  return {
    success: true,
    bookingId,
    holdExpiresAt,
  };
}

/**
 * 4. Fetch Booking Hold Record (with Supabase fallback for cross-device checkouts)
 */
export function getBookingHold(bookingId: string): BookingHoldRecord | null {
  const holds = getLocalHolds();
  const existing = holds.find((h) => h.id === bookingId);
  if (existing) return existing;

  if (bookingId === "sample") {
    const sampleHold: BookingHoldRecord = {
      id: "BK-SAMPLE-99",
      guestId: "guest-test-1",
      hotelId: "h1",
      roomTypeId: "r1",
      hotelName: "Murud Beach Palms Resort",
      roomTypeName: "Deluxe Sea-Facing AC Cottage",
      area: "Dapoli",
      checkIn: "2026-10-15",
      checkOut: "2026-10-17",
      nights: 2,
      weekdayNights: 1,
      weekendNights: 1,
      guests: 2,
      roomsCount: 1,
      totalAmount: 6300,
      status: "requested",
      createdAt: Date.now(),
      holdExpiresAt: Date.now() + 10 * 60 * 1000,
    } as any;
    return sampleHold;
  }

  return null;
}

export async function fetchBookingHold(bookingId: string): Promise<BookingHoldRecord | null> {
  const local = getBookingHold(bookingId);
  if (local) return local;

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
          advance_paid,
          status,
          hold_expires_at,
          created_at,
          utr,
          hotels:hotel_id (name, area),
          room_types:room_type_id (name),
          profiles:guest_id (name, phone)
        `)
        .eq("id", bookingId)
        .maybeSingle();

      if (!error && data) {
        const hotelData = (data as any).hotels;
        const roomData = (data as any).room_types;
        const profileData = (data as any).profiles;
        const holdRecord: BookingHoldRecord = {
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
          holdExpiresAt: data.hold_expires_at ? new Date(data.hold_expires_at).getTime() : Date.now() + 10 * 60 * 1000,
          createdAt: new Date(data.created_at).getTime(),
          upiRefNumber: data.utr || undefined,
        };
        const currentHolds = getLocalHolds();
        if (!currentHolds.some((h) => h.id === holdRecord.id)) {
          saveLocalHolds([...currentHolds, holdRecord]);
        }
        return holdRecord;
      }
    } catch (e) {
      console.warn("fetchBookingHold fallback:", e);
    }
  }

  return null;
}

/**
 * 5. Confirm Booking (Payment completed: Pay at hotel or UPI QR verified)
 */
export async function confirmBookingHold(
  bookingId: string,
  paymentMethod: "pay_at_hotel" | "upi_qr",
  upiRefNumber?: string
): Promise<{ success: boolean; error?: string }> {
  const holds = getLocalHolds();
  const hold = holds.find((h) => h.id === bookingId);

  if (!hold) {
    return { success: false, error: "Booking record not found." };
  }

  // Check if 10-minute hold expired
  if (Date.now() > hold.holdExpiresAt && hold.status === "requested") {
    hold.status = "cancelled";
    saveLocalHolds(holds);
    return {
      success: false,
      error: "HOLD_EXPIRED: The 10-minute hold window for this reservation has expired. Please select dates again.",
    };
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.rpc("confirm_booking", {
        p_booking_id: bookingId,
        p_payment_id: upiRefNumber || "PAY_AT_HOTEL",
      });
    } catch (e) {
      console.warn("Supabase confirm_booking fallback:", e);
    }
  }

  // Mark confirmed and persist
  hold.status = "confirmed";
  hold.paymentMethod = paymentMethod;
  hold.upiRefNumber = upiRefNumber;
  saveLocalHolds(holds);

  return { success: true };
}

/**
 * 6. Release Hold manually or on timeout
 */
export function releaseBookingHold(bookingId: string) {
  const holds = getLocalHolds();
  const updated = holds.map((h) =>
    h.id === bookingId ? { ...h, status: "cancelled" as const } : h
  );
  saveLocalHolds(updated);
}
