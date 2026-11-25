"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getBookingHold, fetchBookingHold, BookingHoldRecord } from "@/lib/booking-service";
import { calculateBookingFee } from "@/lib/manual-payment-service";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Printer,
  Sparkles,
  Lock,
  Unlock,
  FileText,
  Building2,
  Share2
} from "lucide-react";
import { OfflineTravelerPass, TravelerPassData } from "@/components/OfflineTravelerPass";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Point 7: Synthesizes a real-time celebration chime using native Web Audio API
 * 100% Free · 0 External Audio Files · 0 Network Delay
 */
function playBookingConfirmationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First Tone: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second Tone: B5 (987.77 Hz) slightly delayed for a bright chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.60);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.60);
  } catch {
    // Autoplay policy fallback
  }
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params?.id as string;
  const urlMode = searchParams.get("mode");

  const { t } = useLanguage();
  const [booking, setBooking] = useState<any | null>(null);
  const [justConfirmed, setJustConfirmed] = useState<boolean>(false);
  const [showOfflinePass, setShowOfflinePass] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      if (!bookingId) return;
      const record = await fetchBookingHold(bookingId);
      if (record && isMounted) {
        setBooking(record);
        if (record.status === "confirmed" || record.paymentMethod === "pay_at_hotel" || urlMode === "hotel_desk") {
          playBookingConfirmationChime();
        }
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [bookingId, urlMode]);

  // Live polling for verification status every 6 seconds
  useEffect(() => {
    if (!bookingId || !booking) return;
    const isPending = booking.status === "pending_verification" || booking.status === "requested";
    if (!isPending) return;

    const interval = setInterval(async () => {
      const updated = await fetchBookingHold(bookingId);
      if (updated && updated.status !== booking.status) {
        setBooking(updated);
        if (updated.status === "confirmed") {
          setJustConfirmed(true);
          playBookingConfirmationChime();
        }
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [bookingId, booking]);

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Booking Submitted!</h2>
        <p className="text-xs text-slate-500">
          Booking ID: <strong className="font-mono">{bookingId}</strong>
        </p>
        <Link
          href="/my-bookings"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-konkan-teal-700 text-white text-xs font-bold"
        >
          <span>View My Bookings</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const isPayAtHotel = booking.paymentMethod === "pay_at_hotel" || urlMode === "hotel_desk";

  const { bookingFee, balanceAmount } = calculateBookingFee(booking.totalAmount, null, 20);
  const effectiveAdvancePaid = isPayAtHotel ? 0 : bookingFee;
  const effectiveBalanceDue = isPayAtHotel ? booking.totalAmount : balanceAmount;

  const isPendingVerification = !isPayAtHotel && (booking.status === "pending_verification" || booking.status === "requested");

  const conciergePhone = "917447568595"; // Co-Founder Prachii Pawar
  const ownerPhone = conciergePhone;

  // Google Maps Pin Search Link for instant 1-tap navigation
  const mapsSearchQuery = encodeURIComponent(`${booking.hotelName} ${booking.hotelArea} Maharashtra`);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsSearchQuery}`;

  const waConfirmMessage = `*🏖️ Booking Confirmation Voucher — bhramo.com*
--------------------------------
*Booking ID:* ${booking.id}
*Hotel / Homestay:* ${booking.hotelName} (${booking.hotelArea}, Maharashtra)
*Google Maps Location:* ${mapsLink}
*Room Category:* ${booking.roomName}
*Stay Configuration:* ${booking.roomsCount || 1} Room(s) · ${booking.guestsCount || 2} Guest(s)
*Primary Guest:* ${booking.guestName} (${booking.guestPhone})
*Dates of Stay:* ${booking.checkIn} ➔ ${booking.checkOut}
*Total Stay Cost:* ₹${booking.totalAmount}
${
  isPayAtHotel
    ? `*Payment Choice:* 🏨 Pay 100% at Hotel Desk (₹0 Online Advance)
*Payable at Check-In:* ₹${booking.totalAmount} (via UPI / Cash)
*Arrival Guarantee:* Room held guaranteed until 4:00 PM on ${booking.checkIn}`
    : `*Advance Paid (20% via UPI):* ₹${bookingFee} (UTR: ${booking.upiRefNumber || "Submitted"})
*Balance Payable at Hotel Desk:* ₹${balanceAmount}`
}
*Status:* ${isPayAtHotel ? "Reserved (Pay at Hotel Desk)" : isPendingVerification ? "Pending Manual UPI Verification" : "Confirmed"}
--------------------------------
*Co-Founder Support:* Prachii Pawar (+91 74475 68595)
*Meal Note:* Authentic Surmai/Pomfret thalis or Ukdiche Modak can be requested in advance.
bhramo.com — 0% Commission Direct Konkan Stays`;

  const waLink = getWhatsAppLink(ownerPhone, waConfirmMessage);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {justConfirmed && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-200" />
          <span>Payment Verified! Your reservation has just been confirmed by our team.</span>
        </div>
      )}

      {/* Status Hero Card */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-konkan-sand-200 shadow-xl text-center space-y-5">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${
            isPayAtHotel
              ? "bg-teal-100 text-teal-700"
              : isPendingVerification
              ? "bg-amber-100 text-amber-600"
              : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {isPayAtHotel ? (
            <Building2 className="w-9 h-9" />
          ) : isPendingVerification ? (
            <Clock className="w-9 h-9" />
          ) : (
            <CheckCircle2 className="w-9 h-9" />
          )}
        </div>

        <div className="space-y-1.5">
          <span
            className={`text-xs font-bold uppercase tracking-widest ${
              isPayAtHotel
                ? "text-teal-700"
                : isPendingVerification
                ? "text-amber-700"
                : "text-emerald-700"
            }`}
          >
            {isPayAtHotel
              ? "🏨 Pay at Hotel Desk Reserved (₹0 Advance)"
              : isPendingVerification
              ? "Pending Manual UPI Verification"
              : "Reservation Confirmed"}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {isPayAtHotel
              ? "Reservation Locked · Pay at Desk!"
              : isPendingVerification
              ? "UTR Submitted Successfully!"
              : "Pack Your Bags for Konkan!"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {isPayAtHotel
              ? `Your room at ${booking.hotelName} is reserved and guaranteed until 4:00 PM on the day of check-in. ₹0 was paid online — settle 100% (₹${booking.totalAmount}) upon arrival.`
              : isPendingVerification
              ? "Your 12-digit UTR has been submitted for manual audit. Admin verifies payments within 6 hours. Unverified entries auto-expire to protect availability."
              : `Your reservation at ${booking.hotelName} is verified and fully confirmed.`}
          </p>
        </div>

        {/* Reference ID Pill */}
        <div className="inline-block bg-konkan-sand-100 px-5 py-2.5 rounded-2xl border border-konkan-sand-200">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">
            Booking Reference ID
          </span>
          <span className="font-mono font-black text-base text-konkan-teal-950 select-all">
            {booking.id}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send Details to Host on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setShowOfflinePass(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-konkan-teal-800 hover:bg-konkan-teal-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <FileText className="w-4 h-4" />
            <span>{t("action.print_pass", "Download Offline Traveler Pass")}</span>
          </button>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-konkan-sand-300 bg-white hover:bg-konkan-sand-50 text-slate-800 font-bold text-xs sm:text-sm transition-all"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>Open Maps Pin</span>
          </a>
        </div>

        {/* Direct Host Contact Policy Window */}
        <div className="mt-4 p-4 rounded-2xl bg-konkan-sand-50 border border-konkan-sand-200 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            {booking.status === "confirmed" || isPayAtHotel ? (
              <Unlock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="text-slate-900 block font-bold">
                {booking.status === "confirmed" || isPayAtHotel
                  ? "Direct Reception Contact & Concierge Active"
                  : "Direct Host Contact Privacy Window"}
              </strong>
              <p className="text-[11px] text-slate-500">
                {booking.status === "confirmed" || isPayAtHotel
                  ? "Direct phone and landmark instructions are active for your smooth check-in."
                  : t("policy.host_unlocked", "Host direct phone numbers are unlocked immediately upon verification.")}
              </p>
            </div>
          </div>

          {(booking.status === "confirmed" || isPayAtHotel) && (
            <a
              href={`tel:${ownerPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Concierge Desk</span>
            </a>
          )}
        </div>
      </div>

      {/* Booking Summary Receipt */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-konkan-sand-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Booking Summary & Balance</h2>
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-konkan-teal-700 hover:text-konkan-teal-900 font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Property</span>
            <strong className="text-slate-900 text-sm block">{booking.hotelName}</strong>
            <span className="text-slate-500">📍 {booking.hotelArea}, Maharashtra</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Room Category</span>
            <strong className="text-slate-900 text-sm block">{booking.roomName}</strong>
            <span className="text-slate-500">{booking.roomsCount} Room · {booking.guestsCount} Guests</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Dates of Stay</span>
            <span className="font-semibold text-slate-800 text-sm">
              {booking.checkIn} &rarr; {booking.checkOut}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase block text-[10px]">Payment Method</span>
            <span className="font-semibold text-slate-800 text-sm">
              {isPayAtHotel ? "🏨 Pay 100% at Hotel Desk" : `UPI Advance (UTR: ${booking.upiRefNumber || "Submitted"})`}
            </span>
          </div>
        </div>

        {/* Pricing & Remaining Balance Breakdown */}
        <div className="p-4 bg-konkan-sand-50/70 rounded-2xl border border-konkan-sand-200 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Total Accommodation Charges:</span>
            <span className="font-bold text-slate-800">{formatINR(booking.totalAmount)}</span>
          </div>

          <div className="flex justify-between text-emerald-800 font-medium">
            <span>{isPayAtHotel ? "Online Advance Paid:" : "Advance Booking Fee Paid (20% via UPI):"}</span>
            <span className="font-bold text-emerald-700">
              {isPayAtHotel ? "₹0 (Pay at Desk)" : `- ${formatINR(bookingFee)}`}
            </span>
          </div>

          <div className="pt-2 border-t border-konkan-sand-200 flex items-baseline justify-between bg-amber-50/80 -mx-4 -mb-4 p-4 rounded-b-2xl border-amber-200">
            <div>
              <span className="font-black text-amber-950 text-sm block">
                {isPayAtHotel ? "Total Balance Due at Hotel Check-In:" : "Balance Amount to Pay at Hotel:"}
              </span>
              <span className="text-[10px] text-amber-700">
                {isPayAtHotel
                  ? "Pay 100% via UPI or Cash upon check-in · Room held until 4:00 PM"
                  : "To be paid in Cash or UPI at check-in"}
              </span>
            </div>
            <span className="text-2xl font-black text-amber-950">
              {formatINR(effectiveBalanceDue)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="text-xs text-konkan-teal-700 font-semibold hover:underline">
          &larr; Return to bhramo.com Home
        </Link>
      </div>

      {/* Offline Traveler Pass Modal (Feature 1 & 7) */}
      {showOfflinePass && (
        <OfflineTravelerPass
          data={{
            bookingId: booking.id,
            hotelName: booking.hotelName,
            hotelArea: booking.hotelArea,
            hostPhone: ownerPhone,
            roomName: booking.roomName,
            guestName: booking.guestName,
            guestPhone: booking.guestPhone,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            roomsCount: booking.roomsCount,
            guestsCount: booking.guestsCount,
            totalAmount: booking.totalAmount,
            advanceFeePaid: effectiveAdvancePaid,
            balanceAmount: effectiveBalanceDue,
            utr: isPayAtHotel ? "PAY_AT_HOTEL" : booking.upiRefNumber,
            status: isPayAtHotel ? "confirmed" : booking.status,
          }}
          onClose={() => setShowOfflinePass(false)}
        />
      )}
    </div>
  );
}
