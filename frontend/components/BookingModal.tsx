"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Hotel } from "@/types";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import { createBookingHold } from "@/lib/booking-service";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  QrCode,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Lock,
  LogIn
} from "lucide-react";

interface BookingModalProps {
  hotel: Hotel;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ hotel, isOpen, onClose }: BookingModalProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isLoggedIn = Boolean(user || profile);

  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 2),
  });
  const [guestName, setGuestName] = useState(profile?.name || "");
  const [guestPhone, setGuestPhone] = useState(profile?.phone || "");
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"pay_at_hotel" | "upi_qr">("pay_at_hotel");
  const [upiRefNumber, setUpiRefNumber] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (profile) {
      if (!guestName && profile.name) setGuestName(profile.name);
      if (!guestPhone && profile.phone) setGuestPhone(profile.phone);
    }
  }, [profile, guestName, guestPhone]);

  if (!isOpen) return null;

  const checkIn = range?.from || new Date();
  const checkOut = range?.to || addDays(checkIn, 1);
  const nights = Math.max(1, differenceInCalendarDays(checkOut, checkIn));
  const totalAmount = hotel.pricePerNight * nights * roomCount;

  // UPI deep link & QR link generator
  const upiDeepLink = `upi://pay?pa=${hotel.upiId}&pn=${encodeURIComponent(hotel.name)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Booking ${hotel.name}`)}`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiDeepLink)}`;

  // Construct direct WhatsApp message for the hotel owner
  const whatsappMessage = `*🏖️ New Booking Request from bhramo.com*
--------------------------------
*Hotel:* ${hotel.name} (${hotel.location})
*Guest Name:* ${guestName || "Guest"}
*Contact:* ${guestPhone || "Not specified"}
*Check-in:* ${format(checkIn, "dd MMM yyyy")}
*Check-out:* ${format(checkOut, "dd MMM yyyy")}
*Nights:* ${nights} night(s)
*Rooms:* ${roomCount} room(s) | *Guests:* ${guestCount} person(s)
*Total Amount:* ₹${totalAmount}
*Payment Method:* ${paymentMethod === "pay_at_hotel" ? "Pay at Hotel (Cash / UPI on arrival)" : `UPI QR (Manual Confirmation)`}
${paymentMethod === "upi_qr" && upiRefNumber ? `*UPI UTR / Ref:* ${upiRefNumber}` : ""}
--------------------------------
Please confirm availability and booking.`;

  const waLink = getWhatsAppLink(hotel.whatsappNumber, whatsappMessage);

  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [isSubmittingHold, setIsSubmittingHold] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/hotels/${hotel.slug}`)}`);
      return;
    }

    if (!guestName || !guestPhone) {
      alert("Please enter guest name and phone number");
      return;
    }
    setIsSubmittingHold(true);
    try {
      const holdRes = await createBookingHold({
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelArea: hotel.location,
        roomType: {
          id: `rm-${hotel.id}`,
          hotel_id: hotel.id,
          name: `${hotel.name} Room`,
          is_ac: true,
          capacity: 2,
          base_price: hotel.pricePerNight,
          weekend_price: hotel.pricePerNight,
          amenities: hotel.amenities,
          total_rooms: 5,
          created_at: new Date().toISOString(),
        },
        guestName,
        guestPhone,
        checkIn,
        checkOut,
        roomsCount: roomCount,
        guestsCount: guestCount,
        totalAmount,
      });
      if (holdRes.bookingId) {
        setCreatedBookingId(holdRes.bookingId);
      }
    } catch {
      // non-blocking
    } finally {
      setIsSubmittingHold(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-konkan-sand-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-konkan-sand-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-konkan-teal-700 tracking-wide uppercase">
              {hotel.location} · {hotel.beachDistance}
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{hotel.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-konkan-sand-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Booking Hold Created!</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your reservation at <span className="font-semibold text-slate-800">{hotel.name}</span> for{" "}
                <span className="font-semibold text-slate-800">{nights} night(s)</span> is reserved on a 10-minute hold.
              </p>

              <div className="bg-konkan-sand-50 p-4 rounded-xl text-left text-xs space-y-1.5 border border-konkan-sand-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dates:</span>
                  <span className="font-medium text-slate-800">
                    {format(checkIn, "dd MMM")} - {format(checkOut, "dd MMM yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Price:</span>
                  <span className="font-bold text-konkan-teal-700">{formatINR(totalAmount)}</span>
                </div>
                {createdBookingId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono text-konkan-teal-900 font-bold">{createdBookingId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className="font-medium text-slate-800">
                    {paymentMethod === "pay_at_hotel" ? "Pay at Hotel (Cash / UPI)" : "UPI QR (Platform Verification)"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {createdBookingId && (
                  <Link
                    href={`/booking/summary?id=${createdBookingId}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-konkan-teal-700 text-white font-semibold text-sm hover:bg-konkan-teal-800 transition-colors shadow-sm"
                  >
                    <span>Proceed to Platform UPI Verification & Receipt</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Send WhatsApp Message to Hotel Owner</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full py-2 px-4 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Dates Selection (react-day-picker + date-fns) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Check-in & Check-out Dates
                </label>
                <div
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center justify-between p-3 border border-konkan-sand-300 rounded-xl cursor-pointer hover:border-konkan-teal-500 bg-konkan-sand-50/50"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-medium">
                    <CalendarIcon className="w-4 h-4 text-konkan-teal-600" />
                    <span>
                      {format(checkIn, "dd MMM yyyy")} &rarr; {format(checkOut, "dd MMM yyyy")}
                    </span>
                  </div>
                  <span className="text-xs bg-konkan-teal-100 text-konkan-teal-800 font-semibold px-2 py-0.5 rounded-full">
                    {nights} {nights === 1 ? "night" : "nights"}
                  </span>
                </div>

                {showDatePicker && (
                  <div className="mt-2 p-3 bg-white border border-konkan-sand-300 rounded-xl shadow-md flex justify-center">
                    <DayPicker
                      mode="range"
                      defaultMonth={checkIn}
                      selected={range}
                      onSelect={(newRange) => {
                        setRange(newRange);
                        if (newRange?.from && newRange?.to) {
                          setShowDatePicker(false);
                        }
                      }}
                      disabled={{ before: new Date() }}
                      styles={{
                        caption: { color: "#0f766e" },
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Guests and Rooms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rooms
                  </label>
                  <select
                    value={roomCount}
                    onChange={(e) => setRoomCount(Number(e.target.value))}
                    className="w-full p-2.5 border border-konkan-sand-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-konkan-teal-500"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Room" : "Rooms"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guests
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full p-2.5 border border-konkan-sand-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-konkan-teal-500"
                  >
                    {[1, 2, 3, 4, 6, 8, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guest Details */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Patil"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-2.5 border border-konkan-sand-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-konkan-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9820012345"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full p-2.5 border border-konkan-sand-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-konkan-teal-500"
                  />
                </div>
              </div>

              {/* Payment Method Section (Pay at Hotel or UPI QR with manual confirmation) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pay_at_hotel")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === "pay_at_hotel"
                        ? "border-konkan-teal-600 bg-konkan-teal-50/70 ring-1 ring-konkan-teal-600"
                        : "border-konkan-sand-300 bg-white hover:bg-konkan-sand-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-konkan-teal-700" />
                      <span className="text-xs font-bold text-slate-800">Pay at Hotel</span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Pay cash/UPI on arrival in Dapoli/Harnai
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi_qr")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      paymentMethod === "upi_qr"
                        ? "border-konkan-teal-600 bg-konkan-teal-50/70 ring-1 ring-konkan-teal-600"
                        : "border-konkan-sand-300 bg-white hover:bg-konkan-sand-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-konkan-teal-700" />
                      <span className="text-xs font-bold text-slate-800">UPI QR</span>
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      Owner confirmation with 12-digit UTR
                    </span>
                  </button>
                </div>

                {/* If UPI QR selected */}
                {paymentMethod === "upi_qr" && (
                  <div className="mt-3 p-4 bg-konkan-sand-50 rounded-xl border border-konkan-sand-300 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg border border-konkan-sand-200 shrink-0">
                        {/* QR Code image for UPI */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={upiQrUrl}
                          alt="Owner UPI QR Code"
                          className="w-24 h-24 object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold text-slate-800">Direct Owner UPI ID:</div>
                        <div className="font-mono bg-white px-2 py-1 rounded border border-konkan-sand-200 text-konkan-teal-800 select-all font-bold">
                          {hotel.upiId}
                        </div>
                        <p className="text-slate-500 text-[11px] pt-1">
                          Scan with Google Pay, PhonePe, Paytm or BHIM to pay {formatINR(totalAmount)}.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        UPI Reference / UTR Number (for Owner Verification)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter 12-digit UTR (e.g. 412389123456)"
                        value={upiRefNumber}
                        onChange={(e) => setUpiRefNumber(e.target.value)}
                        className="w-full p-2 border border-konkan-sand-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-konkan-teal-600 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-3 bg-konkan-sand-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-600">
                    {formatINR(hotel.pricePerNight)} × {nights} nights ({roomCount} room)
                  </div>
                  <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>0% Platform Commission · Direct Booking</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-slate-500 font-semibold">Total Price</div>
                  <div className="text-lg font-bold text-konkan-teal-900">{formatINR(totalAmount)}</div>
                </div>
              </div>

              {/* Submit Buttons / Login Gate */}
              <div className="space-y-3 pt-2">
                {isLoggedIn ? (
                  <>
                    <button
                      type="submit"
                      disabled={isSubmittingHold}
                      className="w-full py-3 px-4 rounded-xl bg-konkan-teal-700 text-white font-semibold text-sm hover:bg-konkan-teal-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isSubmittingHold ? "Securing 10-Minute Hold..." : "Reserve Stay"}
                    </button>
                    <p className="text-center text-[11px] text-slate-500">
                      Instant confirmation directly shared with hotel owner on WhatsApp.
                    </p>
                  </>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900">Sign In Required to Complete Booking</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      You can calculate pricing and inspect dates freely. To confirm this reservation, please sign in.
                    </p>
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/hotels/${hotel.slug}`)}`}
                      className="w-full py-3 px-4 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In / Register to Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
