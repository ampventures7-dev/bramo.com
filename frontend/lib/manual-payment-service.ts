import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { PlatformSettings, LedgerEntry, BookingStatus } from "@/types/supabase";
import { getBookingHold } from "@/lib/booking-service";
import { getWhatsAppLink } from "@/lib/utils";

const SETTINGS_STORAGE_KEY = "bhramo_platform_settings";
const LEDGER_STORAGE_KEY = "bhramo_ledger_records";
const PENDING_BOOKINGS_KEY = "bhramo_active_booking_holds";

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: "default",
  upi_id: "pawarprachi745-2@okicici",
  // Official GPay QR code for Prachi Pawar
  qr_image_url: "/qr/bhramo-official-qr.png",
  business_name: "Prachi Pawar",
  default_booking_fee_percent: 20,
};

// 1. Settings Get & Update
export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", "default")
        .single();

      if (!error && data) {
        return {
          ...data,
          upi_id: data.upi_id === "bhramo@upi" ? DEFAULT_PLATFORM_SETTINGS.upi_id : data.upi_id,
          business_name: data.business_name === "bhramo.com" ? DEFAULT_PLATFORM_SETTINGS.business_name : data.business_name,
          qr_image_url: data.qr_image_url && data.qr_image_url.includes("bhramo%40upi") ? DEFAULT_PLATFORM_SETTINGS.qr_image_url : data.qr_image_url,
          default_booking_fee_percent: Number(data.default_booking_fee_percent),
        };
      }
    } catch (e) {
      console.warn("Failed to fetch settings from Supabase, using fallback:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate any legacy placeholder dummy UPI ID
        if (parsed.upi_id === "bhramo@upi" || !parsed.upi_id) {
          parsed.upi_id = DEFAULT_PLATFORM_SETTINGS.upi_id;
          parsed.business_name = DEFAULT_PLATFORM_SETTINGS.business_name;
          parsed.qr_image_url = DEFAULT_PLATFORM_SETTINGS.qr_image_url;
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  return DEFAULT_PLATFORM_SETTINGS;
}

export async function updatePlatformSettings(
  newSettings: Partial<PlatformSettings>
): Promise<PlatformSettings> {
  const current = await getPlatformSettings();
  const updated: PlatformSettings = {
    ...current,
    ...newSettings,
    default_booking_fee_percent: Number(newSettings.default_booking_fee_percent ?? current.default_booking_fee_percent),
  };

  if (typeof window !== "undefined") {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn("Could not sync settings to server API:", e);
    }

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
}

// 2. Fee Computation Helper
export function calculateBookingFee(
  totalAmount: number,
  hotelFeePercent?: number | null,
  defaultPercent: number = 20
): { feePercent: number; bookingFee: number; balanceAmount: number } {
  const feePercent = hotelFeePercent != null ? Number(hotelFeePercent) : defaultPercent;
  const bookingFee = Math.round((totalAmount * feePercent) / 100);
  const balanceAmount = Math.max(0, totalAmount - bookingFee);

  return { feePercent, bookingFee, balanceAmount };
}

// 3. Helper to Check Duplicate UTR
export function checkDuplicateUtr(utr: string, currentBookingId?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(PENDING_BOOKINGS_KEY);
    if (!raw) return false;
    const holds: any[] = JSON.parse(raw);

    const match = holds.find(
      (h) =>
        h.upiRefNumber &&
        h.upiRefNumber.trim() === utr.trim() &&
        h.id !== currentBookingId &&
        h.status !== "cancelled"
    );

    return Boolean(match);
  } catch {
    return false;
  }
}

// 4. Submit UTR & Screenshot for Verification (with Server-Side Deduplication & Host Dispatch)
export async function submitUpiForVerification(params: {
  bookingId: string;
  utr: string;
  screenshotUrl?: string;
  hotelName?: string;
  hotelArea?: string;
  roomName?: string;
  guestName?: string;
  guestPhone?: string;
  checkIn?: string;
  checkOut?: string;
  advanceAmount?: number;
  balanceAmount?: number;
}): Promise<{ success: boolean; error?: string; expiresAt?: number }> {
  const cleanUtr = params.utr.trim();

  // 1. Strict 12-digit format check
  if (!/^\d{12}$/.test(cleanUtr)) {
    return {
      success: false,
      error: "Invalid UTR: Transaction ID must be exactly 12 numeric digits.",
    };
  }

  // 2. Server-side verification & anti-fraud deduplication via /api/bookings/verify-utr
  if (typeof window !== "undefined") {
    try {
      const verifyRes = await fetch("/api/bookings/verify-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: params.bookingId,
          utr: cleanUtr,
          screenshotUrl: params.screenshotUrl,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        return {
          success: false,
          error: verifyData.error || "UTR verification failed.",
        };
      }
    } catch (apiErr) {
      console.warn("Server UTR verification API fallback:", apiErr);
    }
  }

  // 3. Check duplicate UTR in local storage as safety check
  if (checkDuplicateUtr(cleanUtr, params.bookingId)) {
    return {
      success: false,
      error: "Duplicate UTR: This transaction ID has already been submitted for another reservation.",
    };
  }

  const expiresAt = Date.now() + 6 * 60 * 60 * 1000; // 6 hours

  // 4. Update local storage cache
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(PENDING_BOOKINGS_KEY);
      if (raw) {
        const holds = JSON.parse(raw);
        const updated = holds.map((h: any) => {
          if (h.id === params.bookingId) {
            return {
              ...h,
              status: "pending_verification",
              upiRefNumber: cleanUtr,
              screenshotUrl: params.screenshotUrl,
              verificationExpiresAt: expiresAt,
            };
          }
          return h;
        });
        localStorage.setItem(PENDING_BOOKINGS_KEY, JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  }

  // 5. Update Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc("submit_booking_upi", {
        p_booking_id: params.bookingId,
        p_utr: cleanUtr,
        p_screenshot_url: params.screenshotUrl || null,
      });

      if (error) {
        const isDuplicate = error.message?.includes("idx_bookings_unique_utr") || error.message?.includes("duplicate");
        return {
          success: false,
          error: isDuplicate
            ? "Duplicate UTR: This 12-digit transaction ID has already been submitted for another booking. Please check your UPI payment receipt."
            : error.message || "Failed to submit transaction details for verification.",
        };
      }
    } catch (e: any) {
      console.warn("Supabase submit_booking_upi warning:", e);
      const isDuplicate = e.message?.includes("idx_bookings_unique_utr") || e.message?.includes("duplicate");
      return {
        success: false,
        error: isDuplicate
          ? "Duplicate UTR: This 12-digit transaction ID has already been submitted for another booking. Please check your UPI payment receipt."
          : e.message || "Failed to submit verification.",
      };
    }
  }

  // 6. Asynchronous Server-Side Host Notification Dispatch
  // Guarantees host receives notification even if traveler closes the browser immediately
  if (typeof window !== "undefined") {
    try {
      const hold = getBookingHold(params.bookingId);
      fetch("/api/bookings/notify-host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: params.bookingId,
          hostPhone: "919422388200",
          hotelName: params.hotelName || hold?.hotelName || "Coastal Stay",
          hotelArea: params.hotelArea || hold?.hotelArea || "Dapoli",
          roomName: params.roomName || hold?.roomName || "Standard Room",
          guestName: params.guestName || hold?.guestName || "Guest",
          guestPhone: params.guestPhone || hold?.guestPhone || "",
          checkIn: params.checkIn || hold?.checkIn || "",
          checkOut: params.checkOut || hold?.checkOut || "",
          advanceAmount: params.advanceAmount || 0,
          balanceAmount: params.balanceAmount || 0,
          utr: cleanUtr,
          screenshotUrl: params.screenshotUrl,
        }),
      }).catch((e) => console.warn("Background host notification dispatch error:", e));
    } catch (notifErr) {
      console.warn("Could not dispatch server notification:", notifErr);
    }
  }

  return { success: true, expiresAt };
}

// 5. Ledger Records & Summary
export function getLedgerRecords(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addLedgerRecord(entry: Omit<LedgerEntry, "id" | "created_at">): LedgerEntry {
  const records = getLedgerRecords();
  const newEntry: LedgerEntry = {
    ...entry,
    id: `led-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const updated = [newEntry, ...records];
  if (typeof window !== "undefined") {
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updated));
  }

  if (isSupabaseConfigured) {
    try {
      supabase.from("ledger").insert([newEntry]);
    } catch (e) {
      console.warn("Supabase ledger insert fallback:", e);
    }
  }

  return newEntry;
}

// 6. Admin Verification & Rejection
export async function adminVerifyBooking(bookingId: string): Promise<{
  success: boolean;
  waLink: string;
  guestPhone: string;
}> {
  let guestPhone = "919876543210";
  let hotelName = "Hotel";
  let totalAmount = 0;
  let feeAmount = 0;
  let balanceAmount = 0;
  let utr = "";

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(PENDING_BOOKINGS_KEY);
    if (raw) {
      const holds = JSON.parse(raw);
      const updated = holds.map((h: any) => {
        if (h.id === bookingId) {
          guestPhone = h.guestPhone || guestPhone;
          hotelName = h.hotelName || hotelName;
          totalAmount = h.totalAmount || 0;
          feeAmount = h.bookingFeeAmount || Math.round(totalAmount * 0.15);
          balanceAmount = totalAmount - feeAmount;
          utr = h.upiRefNumber || "";

          return { ...h, status: "confirmed", confirmedAt: Date.now() };
        }
        return h;
      });
      localStorage.setItem(PENDING_BOOKINGS_KEY, JSON.stringify(updated));
    }
  }

  // Record in Ledger
  addLedgerRecord({
    booking_id: bookingId,
    type: "received",
    amount: feeAmount,
    utr,
    notes: `Verified booking fee (15%) for ${hotelName} [Booking ${bookingId}]`,
  });

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("bookings")
        .update({ status: "confirmed", hold_expires_at: null, verification_expires_at: null })
        .eq("id", bookingId);
    } catch (e) {
      console.warn("Supabase verify update error:", e);
    }
  }

  // Generate confirmation WhatsApp link for guest
  const waMsg = `*🏖️ Booking Confirmed — bhramo.com*
--------------------------------
*Booking ID:* ${bookingId}
*Property:* ${hotelName}
*Status:* CONFIRMED & VERIFIED
*Advance Fee Paid (UPI):* ₹${feeAmount} (UTR: ${utr})
*Balance to Pay at Hotel:* ₹${balanceAmount}
--------------------------------
Your reservation is now fully confirmed. Have a memorable stay in Konkan!`;

  const waLink = getWhatsAppLink(guestPhone, waMsg);

  return { success: true, waLink, guestPhone };
}

export async function adminRejectBooking(bookingId: string, reason?: string) {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(PENDING_BOOKINGS_KEY);
    if (raw) {
      const holds = JSON.parse(raw);
      const updated = holds.map((h: any) => {
        if (h.id === bookingId) {
          return { ...h, status: "cancelled", rejectionReason: reason };
        }
        return h;
      });
      localStorage.setItem(PENDING_BOOKINGS_KEY, JSON.stringify(updated));
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.rpc("cancel_booking_and_restore_rooms", {
        p_booking_id: bookingId,
        p_reason: reason || "Rejected by admin",
      });
    } catch (e) {
      console.warn("Supabase reject update error:", e);
    }
  }
}

// 7. Auto-Expire Unverified Bookings After 6 Hours (Requirement 4)
export function autoExpireUnverifiedBookings(): number {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(PENDING_BOOKINGS_KEY);
    if (raw) {
      const holds = JSON.parse(raw);
      const now = Date.now();
      let expiredCount = 0;

      const updated = holds.map((h: any) => {
        if (
          h.status === "pending_verification" &&
          h.verificationExpiresAt &&
          now > h.verificationExpiresAt
        ) {
          expiredCount++;
          return { ...h, status: "cancelled", expiredAt: now };
        }
        return h;
      });

      if (expiredCount > 0) {
        localStorage.setItem(PENDING_BOOKINGS_KEY, JSON.stringify(updated));
      }
      return expiredCount;
    }
  }

  return 0;
}

// 8. Cancellation Policy & Manual Refund Recording (Requirement 6)
export async function processCancellationWithPolicy(params: {
  bookingId: string;
  checkInDate: string;
  feeAmount: number;
  reason: string;
}): Promise<{ eligibleForRefund: boolean; refundAmount: number; policyNote: string }> {
  const checkIn = new Date(params.checkInDate).getTime();
  const now = Date.now();
  const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);

  let eligibleForRefund = false;
  let refundAmount = 0;
  let policyNote = "";

  if (hoursUntilCheckIn >= 48) {
    // Eligible: Full booking fee minus 5% administrative charge
    eligibleForRefund = true;
    refundAmount = Math.round(params.feeAmount * 0.95);
    policyNote = `Cancelled >48h prior to check-in (${Math.max(0, Math.round(hoursUntilCheckIn))}h remaining). Eligible for 95% refund of booking fee (₹${refundAmount}).`;
  } else {
    // Non-refundable
    eligibleForRefund = false;
    refundAmount = 0;
    policyNote = `Cancelled within 48h of check-in (${Math.max(0, Math.round(hoursUntilCheckIn))}h remaining). Non-refundable under Konkan resort cancellation policy.`;
  }

  // Record refund in ledger if eligible
  if (eligibleForRefund && refundAmount > 0) {
    addLedgerRecord({
      booking_id: params.bookingId,
      type: "refund",
      amount: refundAmount,
      utr: null, // Admin will fill when manual UPI transfer is executed
      notes: `Manual refund pending execution: ${policyNote} [Reason: ${params.reason}]`,
    });
  }

  // Update status in local storage
  if (typeof window !== "undefined") {
    try {
      // 1. Pending bookings
      const rawPending = localStorage.getItem(PENDING_BOOKINGS_KEY);
      if (rawPending) {
        const list = JSON.parse(rawPending);
        const updated = list.map((b: any) => {
          if (b.id === params.bookingId) {
            return {
              ...b,
              status: "cancelled",
              cancellationReason: params.reason,
              refundAmount,
              cancelledAt: Date.now(),
            };
          }
          return b;
        });
        localStorage.setItem(PENDING_BOOKINGS_KEY, JSON.stringify(updated));
      }

      // 2. Holds
      const rawHolds = localStorage.getItem("bhramo_booking_holds");
      if (rawHolds) {
        const list = JSON.parse(rawHolds);
        const updated = list.map((b: any) => {
          if (b.id === params.bookingId) {
            return {
              ...b,
              status: "cancelled",
              cancellationReason: params.reason,
              refundAmount,
              cancelledAt: Date.now(),
            };
          }
          return b;
        });
        localStorage.setItem("bhramo_booking_holds", JSON.stringify(updated));
      }

      // 3. User guest bookings list
      const rawUserBookings = localStorage.getItem("bhramo_guest_bookings");
      if (rawUserBookings) {
        const list = JSON.parse(rawUserBookings);
        const updated = list.map((b: any) => {
          if (b.id === params.bookingId) {
            return {
              ...b,
              status: "cancelled",
              cancellationReason: params.reason,
              refundAmount,
              cancelledAt: Date.now(),
            };
          }
          return b;
        });
        localStorage.setItem("bhramo_guest_bookings", JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Error updating local cancelled booking:", e);
    }
  }

  // Update in Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase.rpc("cancel_booking_and_restore_rooms", {
        p_booking_id: params.bookingId,
        p_reason: params.reason,
      });
    } catch (e) {
      console.warn("Supabase cancel update error:", e);
    }
  }

  return { eligibleForRefund, refundAmount, policyNote };
}

