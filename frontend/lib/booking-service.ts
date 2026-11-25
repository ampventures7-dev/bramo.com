import { format, isBefore, startOfToday, addDays, differenceInCalendarDays } from "date-fns";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { RoomType } from "@/types/supabase";

export interface NightDetail {
  date: string;
  isWeekend: boolean; // Friday (5) or Saturday (6)
  rate: number;
  seasonTag: string;
  multiplier: number;
  isPeakHoliday: boolean;
}

export interface PriceCalculationResult {
  nights: number;
  weekdayNights: number;
  weekendNights: number;
  peakHolidayNights: number;
  totalWeekdayCost: number;
  totalWeekendCost: number;
  totalPeakSurgeCost: number;
  baseRoomCost: number;
  extraGuestsCount: number;
  extraGuestCostPerNight: number;
  totalExtraGuestCost: number;
  effectiveNightlyRate: number;
  totalAmount: number;
  nightDetails: NightDetail[];
  minimumStayNights: number;
  minimumStayViolated: boolean;
  activeSeasonSummary: string;
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
  status: "requested" | "holding" | "pending_verification" | "confirmed" | "cancelled" | "released" | "expired";
  holdExpiresAt: number; // Unix timestamp in ms
  createdAt: number;
}

// Local in-memory / persistent hold store (used as client hydration cache)
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
 * Konkan Tourism Season & Holiday Multiplier Evaluator
 * Identifies high-demand periods (Diwali, New Year, Long Weekends, Monsoons)
 */
function evaluateKonkanDateSeason(date: Date, baseRate: number, weekendRate: number): {
  rate: number;
  seasonTag: string;
  multiplier: number;
  isPeakHoliday: boolean;
  minStay: number;
} {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  // 1. Christmas & New Year Gala Peak (Dec 23 - Jan 2)
  if ((month === 11 && dayOfMonth >= 23) || (month === 0 && dayOfMonth <= 2)) {
    return {
      rate: Math.round(weekendRate * 1.8),
      seasonTag: "New Year / Christmas Peak",
      multiplier: 2.5,
      isPeakHoliday: true,
      minStay: 2,
    };
  }

  // 2. Diwali Festive Week Peak (Late Oct / Early Nov)
  if ((month === 9 && dayOfMonth >= 25) || (month === 10 && dayOfMonth <= 6)) {
    return {
      rate: Math.round(weekendRate * 1.6),
      seasonTag: "Diwali Coastal Peak",
      multiplier: 2.2,
      isPeakHoliday: true,
      minStay: 2,
    };
  }

  // 3. Ganesh Chaturthi Konkan Homecoming Peak (Sep 1 - Sep 12)
  if (month === 8 && dayOfMonth >= 1 && dayOfMonth <= 12) {
    return {
      rate: Math.round(weekendRate * 1.4),
      seasonTag: "Ganesh Festival Surge",
      multiplier: 1.8,
      isPeakHoliday: true,
      minStay: 2,
    };
  }

  // 4. Monsoon Off-Season Special (June 15 - Aug 25)
  if ((month === 5 && dayOfMonth >= 15) || month === 6 || (month === 7 && dayOfMonth <= 25)) {
    const discountedRate = Math.round(baseRate * 0.75);
    return {
      rate: isWeekend ? Math.round(weekendRate * 0.8) : discountedRate,
      seasonTag: "Monsoon Serenity (25% Off)",
      multiplier: 0.75,
      isPeakHoliday: false,
      minStay: 1,
    };
  }

  // 5. Standard Weekend (Fri & Sat nights)
  if (isWeekend) {
    return {
      rate: weekendRate,
      seasonTag: "Coastal Weekend Rate",
      multiplier: Math.round((weekendRate / (baseRate || 1)) * 10) / 10,
      isPeakHoliday: false,
      minStay: 1,
    };
  }

  // 6. Standard Midweek Rate
  return {
    rate: baseRate,
    seasonTag: "Standard Weekday",
    multiplier: 1.0,
    isPeakHoliday: false,
    minStay: 1,
  };
}

/**
 * 1. Dynamic Konkan Pricing Engine
 * Calculates rates factoring in weekend rates, seasonal peak surges (Diwali, New Year),
 * monsoon off-season discounts, extra guest tiers, and minimum stay rules.
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
      peakHolidayNights: 0,
      totalWeekdayCost: 0,
      totalWeekendCost: 0,
      totalPeakSurgeCost: 0,
      baseRoomCost: 0,
      extraGuestsCount: 0,
      extraGuestCostPerNight: 0,
      totalExtraGuestCost: 0,
      effectiveNightlyRate: basePrice,
      totalAmount: 0,
      nightDetails: [],
      minimumStayNights: 1,
      minimumStayViolated: false,
      activeSeasonSummary: "Standard",
    };
  }

  const nights = diffDays;
  let weekdayNights = 0;
  let weekendNights = 0;
  let peakHolidayNights = 0;
  let totalWeekdayCost = 0;
  let totalWeekendCost = 0;
  let totalPeakSurgeCost = 0;
  let maxRequiredMinStay = 1;
  const nightDetails: NightDetail[] = [];

  for (let i = 0; i < nights; i++) {
    const currDate = addDays(checkIn, i);
    const dayOfWeek = currDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    const season = evaluateKonkanDateSeason(currDate, basePrice, weekendPrice);

    if (season.isPeakHoliday) {
      peakHolidayNights++;
      totalPeakSurgeCost += season.rate * roomsCount;
      maxRequiredMinStay = Math.max(maxRequiredMinStay, season.minStay);
    } else if (isWeekend) {
      weekendNights++;
      totalWeekendCost += season.rate * roomsCount;
    } else {
      weekdayNights++;
      totalWeekdayCost += season.rate * roomsCount;
    }

    nightDetails.push({
      date: format(currDate, "yyyy-MM-dd"),
      isWeekend,
      rate: season.rate,
      seasonTag: season.seasonTag,
      multiplier: season.multiplier,
      isPeakHoliday: season.isPeakHoliday,
    });
  }

  const baseRoomCost = totalWeekdayCost + totalWeekendCost + totalPeakSurgeCost;

  // Base occupancy covered by the room base rate
  const baseCoveredGuestsPerRoom = bedsCount === 2 ? 2 : 1;
  const totalBaseCoveredGuests = baseCoveredGuestsPerRoom * roomsCount;

  // Comparative extra guest charge per additional guest per night
  const extraGuestFeePerNight = customExtraGuestFee !== undefined
    ? customExtraGuestFee
    : bedsCount === 2 ? 500 : 400;

  const extraGuestsCount = Math.max(0, guestsCount - totalBaseCoveredGuests);
  const totalExtraGuestCost = extraGuestsCount * extraGuestFeePerNight * nights;

  const totalAmount = baseRoomCost + totalExtraGuestCost;
  const effectiveNightlyRate = Math.round(totalAmount / (nights * roomsCount));

  // Determine active season summary string for UI badges
  let activeSeasonSummary = "Standard Weekday";
  if (peakHolidayNights > 0) {
    activeSeasonSummary = "Konkan Peak Festive Season";
  } else if (weekendNights > 0) {
    activeSeasonSummary = "Weekend Coastal Rate";
  }

  const minimumStayViolated = nights < maxRequiredMinStay;

  return {
    nights,
    weekdayNights,
    weekendNights,
    peakHolidayNights,
    totalWeekdayCost,
    totalWeekendCost,
    totalPeakSurgeCost,
    baseRoomCost,
    extraGuestsCount,
    extraGuestCostPerNight: extraGuestFeePerNight,
    totalExtraGuestCost,
    effectiveNightlyRate,
    totalAmount,
    nightDetails,
    minimumStayNights: maxRequiredMinStay,
    minimumStayViolated,
    activeSeasonSummary,
  };
}

/**
 * 2. Check room availability & handle cross-device holds
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

  const startDateStr = format(checkIn, "yyyy-MM-dd");
  const endDateStr = format(checkOut, "yyyy-MM-dd");

  // 1. Check server-side centralized hold registry via Next.js API
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(
        `/api/bookings/hold?roomTypeId=${roomTypeId}&checkIn=${startDateStr}&checkOut=${endDateStr}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.activeHeldRooms === "number") {
          const defaultTotal = 5;
          const remaining = Math.max(0, defaultTotal - data.activeHeldRooms);
          if (remaining < roomsCount) {
            return {
              available: false,
              error: `SOLD_OUT: This room is currently on hold by another guest for your dates (${remaining} remaining).`,
              remainingRooms: remaining,
            };
          }
        }
      }
    } catch (e) {
      console.warn("Server hold API check fallback:", e);
    }
  }

  // 2. Query Supabase database availability if configured
  if (isSupabaseConfigured) {
    try {
      const { data: rows, error } = await supabase
        .from("availability")
        .select("date, rooms_available")
        .eq("room_type_id", roomTypeId)
        .gte("date", startDateStr)
        .lt("date", endDateStr);

      if (!error && rows && rows.length > 0) {
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
    } catch (e) {
      console.warn("Availability check fallback:", e);
    }
  }

  return {
    available: true,
    remainingRooms: 5,
  };
}

/**
 * 3. Create booking hold with 15-minute lease in atomic server transaction
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
  paymentMethod?: "advance_upi" | "pay_at_hotel";
}): Promise<{ success: boolean; bookingId: string; holdExpiresAt: number; error?: string }> {
  // 1. Verify availability
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

  const checkInStr = format(params.checkIn, "yyyy-MM-dd");
  const checkOutStr = format(params.checkOut, "yyyy-MM-dd");

  // 2. Request Atomic Server Hold via /api/bookings/hold
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: params.hotelId,
          hotelName: params.hotelName,
          hotelArea: params.hotelArea,
          roomTypeId: params.roomType.id,
          roomName: params.roomType.name,
          guestName: params.guestName,
          guestPhone: params.guestPhone,
          guestId: params.guestId,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          roomsCount: params.roomsCount,
          guestsCount: params.guestsCount,
          totalAmount: params.totalAmount,
          paymentMethod: params.paymentMethod || "advance_upi",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          bookingId: "",
          holdExpiresAt: 0,
          error: data.error || "Unable to acquire room hold.",
        };
      }

      const isPayAtHotel = params.paymentMethod === "pay_at_hotel";

      // Cache locally for client session hydration
      const record: BookingHoldRecord = {
        id: data.bookingId,
        hotelId: params.hotelId,
        hotelName: params.hotelName,
        hotelArea: params.hotelArea,
        roomTypeId: params.roomType.id,
        roomName: params.roomType.name,
        guestId: params.guestId,
        guestName: params.guestName,
        guestPhone: params.guestPhone,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        roomsCount: params.roomsCount,
        guestsCount: params.guestsCount,
        totalAmount: params.totalAmount,
        paymentMethod: isPayAtHotel ? "pay_at_hotel" : "upi_qr",
        status: isPayAtHotel ? "confirmed" : "holding",
        holdExpiresAt: data.holdExpiresAt,
        createdAt: Date.now(),
      };

      const currentHolds = getLocalHolds();
      saveLocalHolds([...currentHolds, record]);

      return {
        success: true,
        bookingId: data.bookingId,
        holdExpiresAt: data.holdExpiresAt,
      };
    } catch (err: any) {
      console.warn("Server hold creation fallback:", err);
    }
  }

  // Fallback offline hold (15-minute lease)
  const holdDurationMs = 15 * 60 * 1000;
  const holdExpiresAt = Date.now() + holdDurationMs;
  const bookingId = `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

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
    checkIn: checkInStr,
    checkOut: checkOutStr,
    roomsCount: params.roomsCount,
    guestsCount: params.guestsCount,
    totalAmount: params.totalAmount,
    status: "holding",
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
 * 4. Fetch Booking Hold Record (queries server API first, falls back to Supabase/localStorage)
 */
export function getBookingHold(bookingId: string): BookingHoldRecord | null {
  const holds = getLocalHolds();
  const existing = holds.find((h) => h.id === bookingId);
  if (existing) return existing;

  if (bookingId === "sample") {
    return {
      id: "BK-SAMPLE-99",
      guestId: "guest-test-1",
      hotelId: "h1",
      roomTypeId: "r1",
      hotelName: "Murud Beach Palms Resort",
      roomName: "Deluxe Sea-Facing AC Cottage",
      hotelArea: "Dapoli",
      checkIn: "2026-10-15",
      checkOut: "2026-10-17",
      guestsCount: 2,
      roomsCount: 1,
      totalAmount: 6300,
      status: "holding",
      createdAt: Date.now(),
      holdExpiresAt: Date.now() + 15 * 60 * 1000,
      guestName: "Traveler",
      guestPhone: "919876543210",
    };
  }

  return null;
}

export async function fetchBookingHold(bookingId: string): Promise<BookingHoldRecord | null> {
  // 1. Try server API
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/bookings/hold?id=${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.hold) {
          const holdRecord: BookingHoldRecord = data.hold;
          const currentHolds = getLocalHolds();
          if (!currentHolds.some((h) => h.id === holdRecord.id)) {
            saveLocalHolds([...currentHolds, holdRecord]);
          }
          return holdRecord;
        }
      }
    } catch (e) {
      console.warn("fetchBookingHold server API fallback:", e);
    }
  }

  // 2. Check local storage
  const local = getBookingHold(bookingId);
  if (local) return local;

  // 3. Check Supabase
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
          holdExpiresAt: data.hold_expires_at ? new Date(data.hold_expires_at).getTime() : Date.now() + 15 * 60 * 1000,
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
 * 5. Confirm Booking (Payment completed & verified)
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

  // Check if 15-minute hold expired
  if (Date.now() > hold.holdExpiresAt && (hold.status === "requested" || hold.status === "holding")) {
    hold.status = "expired";
    saveLocalHolds(holds);
    return {
      success: false,
      error: "HOLD_EXPIRED: The 15-minute hold window for this reservation has expired. Please select dates again.",
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
 * 6. Release Hold manually or on abandonment
 */
export async function releaseBookingHold(bookingId: string) {
  if (typeof window !== "undefined") {
    try {
      await fetch(`/api/bookings/hold?id=${bookingId}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Error releasing server hold:", e);
    }
  }

  const holds = getLocalHolds();
  const updated = holds.map((h) =>
    h.id === bookingId ? { ...h, status: "released" as const } : h
  );
  saveLocalHolds(updated);
}
