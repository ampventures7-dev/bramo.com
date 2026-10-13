"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Users,
  CreditCard,
  QrCode,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Plus,
  AlertCircle,
  Eye,
  DollarSign,
  Clock,
  RotateCcw
} from "lucide-react";

interface IncomingBooking {
  id: string;
  guestName: string;
  guestPhone: string;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  bookingFeeAmount: number;
  balanceAmount: number;
  paymentMethod: "pay_at_hotel" | "upi_qr";
  upiRefNumber?: string;
  status: "requested" | "confirmed" | "cancelled" | "pending_verification";
}

const INITIAL_INCOMING_BOOKINGS: IncomingBooking[] = [
  {
    id: "bk-101",
    guestName: "Anand Deshmukh",
    guestPhone: "+91 98200 44551",
    hotelName: "Murud Beach Palms Resort",
    roomName: "Deluxe Coconut Garden AC Room",
    checkIn: "18 Oct 2026",
    checkOut: "20 Oct 2026",
    nights: 2,
    guests: 2,
    totalAmount: 5200,
    bookingFeeAmount: 780, // 15%
    balanceAmount: 4420,
    paymentMethod: "upi_qr",
    upiRefNumber: "419823901248",
    status: "confirmed",
  },
  {
    id: "bk-102",
    guestName: "Sneha Kulkarni",
    guestPhone: "+91 97654 11223",
    hotelName: "Murud Beach Palms Resort",
    roomName: "Family Sea-Breeze Quad Suite",
    checkIn: "24 Oct 2026",
    checkOut: "26 Oct 2026",
    nights: 2,
    guests: 4,
    totalAmount: 8400,
    bookingFeeAmount: 1260, // 15%
    balanceAmount: 7140,
    paymentMethod: "upi_qr",
    upiRefNumber: "420199128833",
    status: "confirmed",
  },
  {
    id: "bk-103",
    guestName: "Vikram Rane",
    guestPhone: "+91 98900 77665",
    hotelName: "Murud Beach Palms Resort",
    roomName: "Deluxe Coconut Garden AC Room",
    checkIn: "01 Nov 2026",
    checkOut: "03 Nov 2026",
    nights: 2,
    guests: 2,
    totalAmount: 5200,
    bookingFeeAmount: 780,
    balanceAmount: 4420,
    paymentMethod: "upi_qr",
    upiRefNumber: "421099881122",
    status: "pending_verification",
  },
];

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { profile, isLoading, signOut } = useAuth();
  const [bookings, setBookings] = useState<IncomingBooking[]>(INITIAL_INCOMING_BOOKINGS);

  // Selected booking for detailed confirmed screen (Requirement 7)
  const [selectedConfirmedBooking, setSelectedConfirmedBooking] = useState<IncomingBooking | null>(null);

  // Route protection: Must be logged in, and guests redirected to my-bookings
  useEffect(() => {
    if (!isLoading) {
      if (!profile) {
        router.push("/login?redirect=/owner/dashboard");
      } else if (profile.role === "guest") {
        router.push("/my-bookings");
      }
    }
  }, [profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-konkan-teal-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Owner Console...</p>
        </div>
      </div>
    );
  }

  // If not logged in or guest, block all details completely
  if (!profile || profile.role === "guest") return null;

  // If registered as owner but not yet approved by platform admin, display locked state
  if (profile.role === "owner" && profile.approval_status === "pending") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-konkan-sand-200 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
            <Clock className="w-8 h-8 text-amber-700 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Host Verification In Progress
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Owner Dashboard Locked
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Welcome, <strong className="text-slate-900">{profile.name}</strong>. Your hotel owner account for{" "}
              <strong className="text-slate-900">{profile.hotel_name || "your registered homestay"}</strong> is currently awaiting administrative approval.
            </p>
          </div>

          <div className="bg-konkan-sand-50/80 p-5 rounded-2xl border border-konkan-sand-200 text-left space-y-3 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-konkan-teal-700" />
              <span>Administrative Approval Policy</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              To protect guest contact information and confidential financial ledgers, all hotel owners must be approved by the platform administrator before access to reservations and property management is unlocked.
            </p>
            <div className="border-t border-konkan-sand-200 pt-2 text-[11px] text-slate-600 space-y-1">
              <div>• <strong>Registered Property:</strong> {profile.hotel_name || "Konkan Coast Property"}</div>
              <div>• <strong>Location:</strong> {profile.hotel_area || "Dapoli / Harnai"}</div>
              <div>• <strong>Verification Status:</strong> <span className="font-bold text-amber-700">Pending Review</span></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="https://wa.me/919422388200?text=Hello%20Bhramo%20Admin%2C%20please%20verify%20my%20hotel%20owner%20account."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Admin (+91 94223 88200)</span>
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-xl border border-konkan-sand-300 hover:bg-konkan-sand-100 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Check Status</span>
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If rejected by admin
  if (profile.role === "owner" && profile.approval_status === "rejected") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-rose-200 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-800 rounded-3xl flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
              Application Not Approved
            </span>
            <h1 className="text-2xl font-black text-slate-900">
              Owner Access Declined
            </h1>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Your application as hotel owner was not approved. Please contact platform operations at support@bhramo.com or WhatsApp +91 94223 88200.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateStatus = (id: string, newStatus: "confirmed" | "cancelled") => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const totalBalanceToCollect = confirmedBookings.reduce((sum, b) => sum + b.balanceAmount, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-konkan-sand-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5" />
            <span>Host Property Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Host Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Logged in as <strong className="text-slate-800">{profile.name}</strong> ({profile.role.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/payments"
            className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors"
          >
            Admin UPI Verifications
          </Link>
          <Link
            href="/hotels"
            className="px-3.5 py-2 rounded-xl border border-konkan-sand-300 bg-white hover:bg-konkan-sand-50 text-slate-800 text-xs font-bold transition-colors"
          >
            Public Stays
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-konkan-sand-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Confirmed Bookings
          </span>
          <div className="text-2xl font-black text-emerald-700">{confirmedBookings.length}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Advance fee verified</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-konkan-sand-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Balance to Collect at Hotel
          </span>
          <div className="text-2xl font-black text-amber-900">{formatINR(totalBalanceToCollect)}</div>
          <p className="text-[11px] text-amber-700 font-medium">Payable by guests at check-in</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-konkan-sand-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending UTR Verification
          </span>
          <div className="text-2xl font-black text-slate-700">
            {bookings.filter((b) => b.status === "pending_verification").length}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Awaiting admin review</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-konkan-sand-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Commission Structure
          </span>
          <div className="text-2xl font-black text-konkan-teal-900">15%</div>
          <p className="text-[11px] text-konkan-teal-700 font-medium">Advance platform fee</p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. BOOKINGS & BALANCE PAYABLE AT HOTEL (Requirement 7) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-konkan-sand-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-konkan-sand-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Reservations & Balance to Collect</h2>
            <p className="text-xs text-slate-500">
              Clear breakdown of advance paid vs. remaining balance guest must pay at your hotel front desk
            </p>
          </div>
          <span className="text-xs bg-konkan-teal-50 text-konkan-teal-800 font-bold px-3 py-1 rounded-full border border-konkan-teal-200">
            {bookings.length} Bookings
          </span>
        </div>

        <div className="space-y-4">
          {bookings.map((booking) => {
            const guestWaMsg = `Hello ${booking.guestName}, this is from ${booking.hotelName}. Your booking for ${booking.checkIn} is confirmed. Balance payable on arrival: ₹${booking.balanceAmount}.`;
            const waLink = getWhatsAppLink(booking.guestPhone, guestWaMsg);

            return (
              <div
                key={booking.id}
                className="p-5 rounded-2xl border border-konkan-sand-200 bg-konkan-sand-50/40 hover:bg-white transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-konkan-sand-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{booking.guestName}</span>
                    <span className="text-xs text-slate-500">({booking.guestPhone})</span>
                    <span className="text-[11px] font-mono text-slate-400">ID: {booking.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        booking.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : booking.status === "pending_verification"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      ● {booking.status === "confirmed" ? "Confirmed (Advance Paid)" : booking.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-slate-600">
                  {/* Dates & Room */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Room & Duration
                    </span>
                    <strong className="text-slate-800 block">{booking.roomName}</strong>
                    <span>
                      {booking.checkIn} &rarr; {booking.checkOut} ({booking.nights} nights)
                    </span>
                    <span className="text-slate-500 block">{booking.guests} Guests</span>
                  </div>

                  {/* Advance Paid */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Advance Fee Paid (15%)
                    </span>
                    <span className="font-bold text-emerald-700 text-sm block">
                      {formatINR(booking.bookingFeeAmount)}
                    </span>
                    {booking.upiRefNumber && (
                      <span className="text-[10px] font-mono text-slate-500 block">
                        UTR: {booking.upiRefNumber}
                      </span>
                    )}
                  </div>

                  {/* Balance to Collect at Hotel (Requirement 7) */}
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block">
                      Balance to Collect at Hotel
                    </span>
                    <span className="text-base font-black text-amber-950 block">
                      {formatINR(booking.balanceAmount)}
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">
                      Payable by guest upon check-in
                    </span>
                  </div>

                  {/* Actions */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Host Actions
                    </span>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedConfirmedBooking(booking)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-konkan-teal-50 text-konkan-teal-900 border border-konkan-teal-200 text-xs font-bold hover:bg-konkan-teal-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Confirmed Screen</span>
                      </button>

                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Guest</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CONFIRMED BOOKING MODAL (Requirement 7) */}
      {/* ========================================================= */}
      {selectedConfirmedBooking && (
        <div
          onClick={() => setSelectedConfirmedBooking(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-7 border border-konkan-sand-200 shadow-2xl space-y-6 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-konkan-sand-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h3 className="font-extrabold text-lg text-slate-900">
                  Confirmed Booking Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConfirmedBooking(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-konkan-sand-50 p-4 rounded-2xl border border-konkan-sand-200 space-y-1">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Property & Room</div>
                <div className="text-base font-bold text-slate-900">
                  {selectedConfirmedBooking.hotelName}
                </div>
                <div className="text-konkan-teal-800 font-semibold">
                  {selectedConfirmedBooking.roomName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-konkan-sand-50 p-4 rounded-2xl border border-konkan-sand-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Guest</span>
                  <strong className="text-slate-800 text-sm block">
                    {selectedConfirmedBooking.guestName}
                  </strong>
                  <span className="text-slate-600">{selectedConfirmedBooking.guestPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Dates</span>
                  <strong className="text-slate-800 text-sm block">
                    {selectedConfirmedBooking.checkIn} &rarr; {selectedConfirmedBooking.checkOut}
                  </strong>
                  <span className="text-slate-600">{selectedConfirmedBooking.nights} nights</span>
                </div>
              </div>

              {/* Requirement 7: Balance Amount the guest will pay at the hotel */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-amber-900 font-bold uppercase text-[11px]">
                    Total Reservation Value:
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatINR(selectedConfirmedBooking.totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-emerald-800">
                  <span className="font-semibold">Advance Booking Fee Paid (UPI):</span>
                  <span className="font-bold">
                    - {formatINR(selectedConfirmedBooking.bookingFeeAmount)}
                  </span>
                </div>

                <div className="pt-2 border-t border-amber-200 flex justify-between items-baseline">
                  <div>
                    <span className="font-black text-amber-950 text-sm block">
                      Balance Payable at Hotel:
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Collect in Cash or UPI at front desk
                    </span>
                  </div>
                  <span className="text-2xl font-black text-amber-950">
                    {formatINR(selectedConfirmedBooking.balanceAmount)}
                  </span>
                </div>
              </div>

              {selectedConfirmedBooking.upiRefNumber && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Verified UTR: <strong>{selectedConfirmedBooking.upiRefNumber}</strong>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={getWhatsAppLink(
                  selectedConfirmedBooking.guestPhone,
                  `Hi ${selectedConfirmedBooking.guestName}, we are excited to welcome you to ${selectedConfirmedBooking.hotelName}. Your balance at check-in will be ₹${selectedConfirmedBooking.balanceAmount}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Guest Details</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedConfirmedBooking(null)}
                className="px-4 py-3 rounded-xl border border-konkan-sand-300 bg-white hover:bg-konkan-sand-50 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
