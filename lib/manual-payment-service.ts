import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { PlatformSettings, LedgerEntry, BookingStatus } from "@/types/supabase";
import { getBookingHold } from "@/lib/booking-service";
import { getWhatsAppLink } from "@/lib/utils";

const SETTINGS_STORAGE_KEY = "bhramo_platform_settings";
const LEDGER_STORAGE_KEY = "bhramo_ledger_records";
const PENDING_BOOKINGS_KEY = "bhramo_active_booking_holds";

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: "default",
  upi_id: "bhramo@upi",
  // Dummy QR code for local preview/development
  qr_image_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi%3A%2F%2Fpay%3Fpa%3Dbhramo%40upi%26pn%3Dbhramo.com%26cu%3DINR",
  business_name: "bhramo.com",
  default_booking_fee_percent: 15,
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
      if (saved) return JSON.parse(saved);
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

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("platform_settings")
        .upsert({ ...updated, id: "default", updated_at: new Date().toISOString() });
    } catch (e) {
      console.warn("Error updating settings in Supabase:", e);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
}

// 2. Fee Computation Helper
export function calculateBookingFee(
  totalAmount: number,
  hotelFeePercent?: number | null,
  defaultPercent: number = 15
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

// 4. Submit UTR & Screenshot for Verification
export async function submitUpiForVerification(params: {
  bookingId: string;
  utr: string;
  screenshotUrl?: string;
}): Promise<{ success: boolean; error?: string; expiresAt?: number }> {
  // Strict 12-digit validation
  const cleanUtr = params.utr.trim();
  if (!/^\d{12}$/.test(cleanUtr)) {
    return {
      success: false,
      error: "Invalid UTR: Transaction ID must be exactly 12 numeric digits.",
    };
  }

  // Check duplicate UTR
  if (checkDuplicateUtr(cleanUtr, params.bookingId)) {
    return {
      success: false,
      error: "Duplicate UTR: This transaction ID has already been submitted for another reservation.",
    };
  }

  const expiresAt = Date.now() + 6 * 60 * 60 * 1000; // 6 hours

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

  return { success: true, expiresAt };
}

// 5. Ledger Records & Summary
export function getLedgerRecords(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) {
      // Seed with initial entries for demonstration
      const initial: LedgerEntry[] = [
        {
          id: "led-01",
          booking_id: "bk-101",
          type: "received",
          amount: 780,
          utr: "419823901248",
          notes: "Booking fee received (15%) for Murud Beach Palms Resort",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "led-02",
          booking_id: "bk-099",
          type: "payout",
          amount: 4420,
          utr: "419800112233",
          notes: "Host payout settled for Dapoli Host",
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(initial));
      return initial;
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

