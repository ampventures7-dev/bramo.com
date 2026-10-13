"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { processCancellationWithPolicy } from "@/lib/manual-payment-service";
import { submitBookingReview, getLocalReviews, BookingReviewItem } from "@/lib/review-service";
import { downloadVoucherFile, generateVoucherHtml, VoucherBookingData } from "@/lib/voucher-generator";
import {
  CalendarCheck,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  QrCode,
  ArrowRight,
  Compass,
  AlertCircle,
  Download,
  Printer,
  XCircle,
  Star,
  CheckCircle2,
  Calendar,
  Users,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
  ExternalLink
} from "lucide-react";

export interface GuestBookingItem {
  id: string;
  hotelId: string;
  hotelName: string;
  area: "Dapoli" | "Harnai";
  address: string;
  roomName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guests: number;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  paymentMethod: "pay_at_hotel" | "upi_qr";
  utr?: string;
  status: "confirmed" | "pending_verification" | "completed" | "cancelled";
  image: string;
  ownerWhatsapp: string;
  createdAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  review?: BookingReviewItem | null;
}

// Initial realistic seed bookings covering all 3 core test states:
// 1. Upcoming Confirmed (allows download voucher & cancellation >48h)
// 2. Upcoming Pending Verification (manual UPI audit)
// 3. Past Completed (ready for Review rating + comment)
// 4. Past Completed (with existing review)
const INITIAL_SEED_BOOKINGS: GuestBookingItem[] = [
  {
    id: "BK-DAP-901",
    hotelId: "b1111111-1111-1111-1111-111111111111",
    hotelName: "Murud Beach Palms Resort",
    area: "Dapoli",
    address: "Murud Beach Road, Dapoli 415713, Maharashtra",
    roomName: "Deluxe Sea-Facing AC Cottage",
    checkIn: "2026-10-18",
    checkOut: "2026-10-20",
    nights: 2,
    guests: 2,
    totalAmount: 5200,
    advancePaid: 780, // 15% booking fee
    balanceAmount: 4420,
    paymentMethod: "upi_qr",
    utr: "429184719283",
    status: "confirmed",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    ownerWhatsapp: "919422388200",
    createdAt: "2026-10-09T14:30:00Z",
  },
  {
    id: "BK-HAR-902",
    hotelId: "b2222222-2222-2222-2222-222222222222",
    hotelName: "Suvarnadurg Coastal Haven",
    area: "Harnai",
    address: "Harnai Port Road, Near Sea Fort, Harnai 415713",
    roomName: "Suvarnadurg Sea Fort View AC Suite",
    checkIn: "2026-11-02",
    checkOut: "2026-11-04",
    nights: 2,
    guests: 2,
    totalAmount: 4800,
    advancePaid: 720,
    balanceAmount: 4080,
    paymentMethod: "upi_qr",
    utr: "419827361829",
    status: "pending_verification",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
    ownerWhatsapp: "919823411001",
    createdAt: "2026-10-10T11:00:00Z",
  },
  {
    id: "BK-DAP-898",
    hotelId: "b3333333-3333-3333-3333-333333333333",
    hotelName: "Karde Golden Sands Cottages",
    area: "Dapoli",
    address: "Karde Beach Village, Post Murud, Taluka Dapoli 415712",
    roomName: "Heritage Laterite AC Cottage",
    checkIn: "2026-09-25",
    checkOut: "2026-09-27",
    nights: 2,
    guests: 3,
    totalAmount: 6400,
    advancePaid: 960,
    balanceAmount: 5440,
    paymentMethod: "upi_qr",
    utr: "389102847291",
    status: "completed",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    ownerWhatsapp: "919422388200",
    createdAt: "2026-09-20T10:00:00Z",
    review: null, // Ready for test review submission!
  },
  {
    id: "BK-DAP-899",
    hotelId: "b1111111-1111-1111-1111-111111111111",
    hotelName: "Murud Beach Palms Resort",
    area: "Dapoli",
    address: "Murud Beach Road, Dapoli 415713, Maharashtra",
    roomName: "Family Coconut Grove Villa",
    checkIn: "2026-09-10",
    checkOut: "2026-09-12",
    nights: 2,
    guests: 4,
    totalAmount: 7600,
    advancePaid: 1140,
    balanceAmount: 6460,
    paymentMethod: "upi_qr",
    utr: "318291039482",
    status: "completed",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    ownerWhatsapp: "919422388200",
    createdAt: "2026-09-05T12:00:00Z",
    review: {
      id: "rev-899",
      booking_id: "BK-DAP-899",
      hotel_id: "b1111111-1111-1111-1111-111111111111",
      guest_id: "guest-test-1",
      rating: 5,
      comment: "Superb hospitality! Suresh-ji arranged early morning dolphin spotting at Murud beach and authentic Sol Kadhi. Highly recommend!",
      created_at: "2026-09-13T10:00:00Z",
    },
  },
];

export default function MyBookingsPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [bookings, setBookings] = useState<GuestBookingItem[]>([]);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Route protection: Only logged in users allowed
  useEffect(() => {
    if (!isLoading && !profile) {
      router.push("/login");
    }
  }, [isLoading, profile, router]);

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<GuestBookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("Change of travel plans");
  const [isProcessingCancel, setIsProcessingCancel] = useState<boolean>(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Review Modal State
  const [reviewingBooking, setReviewingBooking] = useState<GuestBookingItem | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Voucher Preview Modal State
  const [previewingVoucher, setPreviewingVoucher] = useState<GuestBookingItem | null>(null);

  // Load and merge dynamically created bookings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // 1. Load any saved user bookings
      const rawUserBookings = localStorage.getItem("bhramo_guest_bookings");
      let storedList: GuestBookingItem[] = [];
      if (rawUserBookings) {
        storedList = JSON.parse(rawUserBookings);
      } else {
        // Only seed test user with sample data
        storedList = profile?.id === "guest-test-1" ? INITIAL_SEED_BOOKINGS : [];
      }

      // 2. Check active holds / pending bookings submitted during checkout
      const rawPending = localStorage.getItem("bhramo_active_booking_holds");
      if (rawPending) {
        const pendingHolds = JSON.parse(rawPending);
        pendingHolds.forEach((hold: any) => {
          const exists = storedList.some((b) => b.id === hold.id);
          if (!exists && hold.status) {
            const newBooking: GuestBookingItem = {
              id: hold.id,
              hotelId: hold.hotelId || "b1111111-1111-1111-1111-111111111111",
              hotelName: hold.hotelName || "Konkan Coastal Stay",
              area: hold.area || "Dapoli",
              address: "Coastal Beach Road, Dapoli / Harnai",
              roomName: hold.roomTypeName || "Selected Room",
              checkIn: hold.checkIn,
              checkOut: hold.checkOut,
              nights: hold.nights || 1,
              guests: hold.guests || 2,
              totalAmount: hold.totalAmount,
              advancePaid: Math.round(hold.totalAmount * 0.15),
              balanceAmount: hold.totalAmount - Math.round(hold.totalAmount * 0.15),
              paymentMethod: "upi_qr",
              utr: hold.upiRefNumber || hold.paymentId,
              status: hold.status === "confirmed" ? "confirmed" : "pending_verification",
              image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
              ownerWhatsapp: "919422388200",
              createdAt: new Date().toISOString(),
            };
            storedList.unshift(newBooking);
          }
        });
      }

      // 3. Attach any locally stored reviews
      const localReviews = getLocalReviews();
      const withReviews = storedList.map((b) => {
        const matchingReview = localReviews.find((r) => r.booking_id === b.id);
        if (matchingReview) {
          return { ...b, review: matchingReview };
        }
        return b;
      });

      setBookings(withReviews);
    } catch (err) {
      console.warn("Failed to sync bookings from localStorage:", err);
    }
  }, []);

  // Fetch live bookings from Supabase when logged in and configured
  useEffect(() => {
    const guestId = profile?.id;
    if (!isSupabaseConfigured || !guestId) return;

    async function fetchDbBookings() {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            hotel_id,
            check_in,
            check_out,
            guests,
            rooms_count,
            total_amount,
            advance_paid,
            status,
            utr,
            created_at,
            hotels:hotel_id (
              id,
              name,
              area,
              address
            ),
            room_types:room_type_id (
              name
            )
          `)
          .eq("guest_id", guestId)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: GuestBookingItem[] = data.map((d: any) => ({
            id: d.id,
            hotelId: d.hotel_id,
            hotelName: d.hotels?.name || "Konkan Resort",
            area: (d.hotels?.area as any) || "Dapoli",
            address: d.hotels?.address || "Dapoli, Maharashtra",
            roomName: d.room_types?.name || "Standard Room",
            checkIn: d.check_in,
            checkOut: d.check_out,
            nights: Math.max(1, Math.round((new Date(d.check_out).getTime() - new Date(d.check_in).getTime()) / (1000 * 60 * 60 * 24))),
            guests: d.guests || 2,
            totalAmount: Number(d.total_amount),
            advancePaid: Number(d.advance_paid || 0),
            balanceAmount: Math.max(0, Number(d.total_amount) - Number(d.advance_paid || 0)),
            paymentMethod: "upi_qr",
            utr: d.utr,
            status: d.status,
            image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
            ownerWhatsapp: "919422388200",
            createdAt: d.created_at,
          }));

          setBookings((prev) => {
            const existingIds = new Set(mapped.map((m) => m.id));
            const retainedMock = prev.filter((p) => !existingIds.has(p.id));
            return [...mapped, ...retainedMock];
          });
        }
      } catch (e) {
        console.warn("Supabase fetch bookings warning:", e);
      }
    }

    fetchDbBookings();
  }, [profile]);

  // Filter Bookings by Tab
  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending_verification"
  );
  const pastBookings = bookings.filter((b) => b.status === "completed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  const displayedBookings =
    activeTab === "upcoming"
      ? upcomingBookings
      : activeTab === "past"
      ? pastBookings
      : cancelledBookings;

  // Copy UTR handler
  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // Helper to calculate hours until check-in for cancellation preview
  const getHoursUntilCheckIn = (checkInDateStr: string) => {
    const checkInTime = new Date(`${checkInDateStr}T12:00:00`).getTime();
    const now = Date.now();
    return Math.max(0, Math.round((checkInTime - now) / (1000 * 60 * 60)));
  };

  // 1. Cancellation Execution Handler
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;

    setIsProcessingCancel(true);
    setCancelSuccessMsg(null);

    const res = await processCancellationWithPolicy({
      bookingId: cancellingBooking.id,
      checkInDate: cancellingBooking.checkIn,
      feeAmount: cancellingBooking.advancePaid,
      reason: cancelReason,
    });

    setIsProcessingCancel(false);

    // Update state locally
    const updatedBookings = bookings.map((b) => {
      if (b.id === cancellingBooking.id) {
        return {
          ...b,
          status: "cancelled" as const,
          cancellationReason: cancelReason,
          refundAmount: res.refundAmount,
        };
      }
      return b;
    });

    setBookings(updatedBookings);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhramo_guest_bookings", JSON.stringify(updatedBookings));
    }

    setCancelSuccessMsg(
      res.eligibleForRefund
        ? `Cancellation confirmed. You are eligible for ₹${res.refundAmount} (95% refund). Manual UPI refund has been queued for admin verification.`
        : "Cancellation confirmed. Under the 48-hour policy, the advance booking fee is non-refundable. Your room hold has been released."
    );

    setTimeout(() => {
      setCancellingBooking(null);
      setCancelSuccessMsg(null);
      setActiveTab("cancelled");
    }, 2500);
  };

  // 2. Review Submission Handler (Completed bookings only)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingBooking) return;

    setIsSubmittingReview(true);
    setReviewError(null);

    const res = await submitBookingReview({
      bookingId: reviewingBooking.id,
      hotelId: reviewingBooking.hotelId,
      guestId: profile?.id || "guest-123",
      guestName: profile?.name || "Verified Konkan Traveler",
      hotelName: reviewingBooking.hotelName,
      rating: reviewRating,
      comment: reviewComment,
    });

    setIsSubmittingReview(false);

    if (!res.success) {
      setReviewError(res.error || "Failed to submit review.");
      return;
    }

    // Attach review to booking in state
    const updated = bookings.map((b) => {
      if (b.id === reviewingBooking.id) {
        return { ...b, review: res.review };
      }
      return b;
    });

    setBookings(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhramo_guest_bookings", JSON.stringify(updated));
    }

    setReviewSuccessMsg("Thank you! Your verified review and rating have been posted.");
    setTimeout(() => {
      setReviewingBooking(null);
      setReviewSuccessMsg(null);
      setReviewComment("");
    }, 1800);
  };

  // 3. Voucher Download Helper
  const handleDownloadVoucher = (booking: GuestBookingItem) => {
    const voucherData: VoucherBookingData = {
      id: booking.id,
      hotelName: booking.hotelName,
      area: booking.area,
      address: booking.address,
      roomName: booking.roomName,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      totalAmount: booking.totalAmount,
      advancePaid: booking.advancePaid,
      balanceAmount: booking.balanceAmount,
      paymentMethod: booking.paymentMethod,
      utr: booking.utr,
      guestName: profile?.name || "Valued Konkan Guest",
      guestPhone: profile?.phone || "+91 94223 88200",
      ownerWhatsapp: booking.ownerWhatsapp,
      status: booking.status,
      createdAt: booking.createdAt,
    };

    downloadVoucherFile(voucherData);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-konkan-sand-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5" />
            <span>Konkan Guest Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            My Bookings & Stays
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Logged in as <strong className="text-slate-800">{profile?.name || "Konkan Guest"}</strong> · Manage upcoming coastal trips, download vouchers, and write reviews
          </p>
        </div>

        <Link
          href="/hotels"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs shadow-sm transition-colors self-start md:self-auto"
        >
          <span>Explore Dapoli & Harnai Stays</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-konkan-sand-200 pb-3">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "upcoming"
              ? "bg-konkan-teal-700 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming Stays</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {upcomingBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("past")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "past"
              ? "bg-konkan-teal-700 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Past Stays (Reviews)</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "past" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {pastBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("cancelled")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "cancelled"
              ? "bg-rose-700 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancelled Bookings</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "cancelled" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {cancelledBookings.length}
          </span>
        </button>
      </div>

      {/* Cancellation Policy Banner for transparency */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Konkan Stays Cancellation Policy:</span> Free cancellation with a <strong>95% refund</strong> of the booking fee up to 48 hours prior to check-in. Cancellations within 48 hours are non-refundable. Remaining balances are always waived and held rooms released.
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-100 px-2.5 py-1 rounded-lg text-amber-800 shrink-0 self-start sm:self-auto">
          0% Gateway Fees
        </span>
      </div>

      {/* Bookings List */}
      {displayedBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-konkan-sand-200 shadow-sm space-y-4">
          <CalendarCheck className="w-12 h-12 text-konkan-teal-600 mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-slate-900">
            {activeTab === "upcoming"
              ? "No Upcoming Reservations"
              : activeTab === "past"
              ? "No Past Completed Stays"
              : "No Cancelled Bookings"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "upcoming"
              ? "You do not have any active upcoming stays. Discover handpicked sea-view cottages and homestays in Dapoli and Harnai."
              : activeTab === "past"
              ? "Completed stays will appear here after your checkout, where you can rate and write authentic reviews."
              : "Cancelled reservations and manual refund audit details will show here."}
          </p>
          <Link
            href="/hotels"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-konkan-teal-700 text-white text-xs font-semibold hover:bg-konkan-teal-800 transition-colors"
          >
            Browse Konkan Hotels & Cottages
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedBookings.map((item) => {
            const waMsg = `Hi, I am inquiring about my booking *${item.id}* at *${item.hotelName}* for ${item.checkIn}.`;
            const waLink = getWhatsAppLink(item.ownerWhatsapp, waMsg);
            const hoursLeft = getHoursUntilCheckIn(item.checkIn);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-konkan-sand-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row"
              >
                {/* Hotel Thumbnail */}
                <div className="relative w-full lg:w-72 h-52 lg:h-auto bg-slate-100 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.hotelName}
                    fill
                    sizes="(max-width: 1024px) 100vw, 288px"
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-konkan-teal-800/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-konkan-teal-200" />
                    <span>{item.area}</span>
                  </div>

                  {item.status === "completed" && (
                    <div className="absolute bottom-3 left-3 bg-emerald-600/95 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                      <span>Stay Completed</span>
                    </div>
                  )}
                </div>

                {/* Booking Information Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Top Row: Booking ID + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold text-slate-500">
                          Booking ID: <strong className="text-slate-800 font-bold">{item.id}</strong>
                        </span>
                        {item.utr && (
                          <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded-md border border-slate-200">
                            <span>UTR: {item.utr}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyUtr(item.utr!)}
                              title="Copy UTR"
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedUtr === item.utr ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div>
                        {item.status === "confirmed" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Confirmed & Verified</span>
                          </span>
                        )}
                        {item.status === "pending_verification" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending UPI Verification</span>
                          </span>
                        )}
                        {item.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-konkan-teal-50 text-konkan-teal-800 border border-konkan-teal-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-konkan-teal-600" />
                            <span>Completed Stay</span>
                          </span>
                        )}
                        {item.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cancelled</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hotel & Room Title */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">{item.hotelName}</h3>
                      <p className="text-xs text-konkan-teal-700 font-semibold mt-0.5">{item.roomName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.address}</p>
                    </div>

                    {/* Dates & Duration Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-konkan-sand-50/70 p-3 rounded-2xl border border-konkan-sand-200/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Check-in</span>
                        <span className="font-bold text-slate-800">{item.checkIn}</span>
                        <span className="text-[10px] text-slate-400 block">From 12:00 PM</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Check-out</span>
                        <span className="font-bold text-slate-800">{item.checkOut}</span>
                        <span className="text-[10px] text-slate-400 block">Until 10:00 AM</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Duration</span>
                        <span className="font-bold text-slate-800">{item.nights} Nights</span>
                        <span className="text-[10px] text-slate-400 block">{item.guests} Guests</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Advance Paid</span>
                        <span className="font-bold text-konkan-teal-700">{formatINR(item.advancePaid)}</span>
                        <span className="text-[10px] text-emerald-600 block">Via UPI</span>
                      </div>
                    </div>

                    {/* Balance Payable at Hotel vs Completed/Cancelled Details */}
                    {item.status !== "cancelled" && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            {item.status === "completed" ? "Settled Total Amount" : "Pay at Hotel (Remaining Balance)"}
                          </span>
                          <span className="text-base font-extrabold text-slate-900">
                            {item.status === "completed" ? formatINR(item.totalAmount) : formatINR(item.balanceAmount)}
                          </span>
                          {item.status !== "completed" && (
                            <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                              (Cash or UPI at front desk)
                            </span>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-slate-500">
                          <span>Total: <strong>{formatINR(item.totalAmount)}</strong></span>
                          <span className="mx-1.5">·</span>
                          <span className="text-emerald-700 font-medium">Advance Paid: {formatINR(item.advancePaid)}</span>
                        </div>
                      </div>
                    )}

                    {/* Cancellation Details if Cancelled */}
                    {item.status === "cancelled" && (
                      <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cancellation & Refund Summary</span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          {item.cancellationReason ? `Reason: "${item.cancellationReason}". ` : ""}
                          {item.refundAmount && item.refundAmount > 0
                            ? `Eligible Refund: ₹${item.refundAmount} (95% of advance). Manual UPI refund entry recorded in platform ledger for admin completion.`
                            : "No refund applicable as cancellation occurred within 48 hours of check-in."}
                        </p>
                      </div>
                    )}

                    {/* Review Snippet if already reviewed */}
                    {item.review && (
                      <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/80 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= item.review!.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                }`}
                              />
                            ))}
                            <span className="text-[11px] font-bold text-slate-700 ml-1.5">
                              Your Verified Rating ({item.review.rating}/5)
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">Verified Guest Review</span>
                        </div>
                        <p className="text-[12px] text-slate-700 italic">
                          &ldquo;{item.review.comment}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-konkan-sand-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. Download Confirmation Voucher Button */}
                      {(item.status === "confirmed" || item.status === "completed" || item.status === "pending_verification") && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDownloadVoucher(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Voucher</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewingVoucher(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-konkan-sand-300 bg-white hover:bg-konkan-sand-50 text-slate-700 font-semibold text-xs transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Print Preview</span>
                          </button>
                        </>
                      )}

                      {/* 2. Review Button (Strictly for Completed Stays) */}
                      {item.status === "completed" && !item.review && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingBooking(item);
                            setReviewRating(5);
                            setReviewComment("");
                            setReviewError(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors animate-pulse hover:animate-none"
                        >
                          <Star className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Write a Review</span>
                        </button>
                      )}

                      {/* 3. Cancel Option with Policy (for Upcoming Stays) */}
                      {(item.status === "confirmed" || item.status === "pending_verification") && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingBooking(item);
                            setCancelSuccessMsg(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Cancel Booking</span>
                        </button>
                      )}
                    </div>

                    {/* WhatsApp Direct Host Connect */}
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-colors shadow-sm ml-auto"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Host</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CANCELLATION DIALOG WITH POLICY BREAKDOWN */}
      {/* ========================================================================= */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900">Cancel Reservation</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{cancellingBooking.hotelName}</div>
              <div className="text-slate-600">{cancellingBooking.roomName}</div>
              <div className="text-slate-500">
                Check-in: <strong>{cancellingBooking.checkIn}</strong> (Check-out: {cancellingBooking.checkOut})
              </div>
              <div className="text-slate-500">
                Advance Paid: <strong className="text-konkan-teal-700">{formatINR(cancellingBooking.advancePaid)}</strong> (Total: {formatINR(cancellingBooking.totalAmount)})
              </div>
            </div>

            {/* Policy Calculation Box */}
            {(() => {
              const hours = getHoursUntilCheckIn(cancellingBooking.checkIn);
              const isEligible = hours >= 48;
              const refundAmount = isEligible ? Math.round(cancellingBooking.advancePaid * 0.95) : 0;

              return (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    isEligible
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : "bg-amber-50/80 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {isEligible ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>
                      {isEligible
                        ? `Eligible for 95% Refund (${hours}h until check-in)`
                        : `Non-Refundable Window (${hours}h until check-in)`}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed">
                    {isEligible
                      ? `Because your cancellation request is more than 48 hours before check-in, you will receive a 95% refund of your advance booking fee (₹${refundAmount}). A 5% administrative fee (₹${cancellingBooking.advancePaid - refundAmount}) is retained.`
                      : "Because your cancellation is within 48 hours of check-in, the advance booking fee is non-refundable per coastal resort guidelines. Any balance payable at the hotel is waived."}
                  </p>

                  <div className="pt-2 border-t border-current/20 flex justify-between font-bold text-sm">
                    <span>Refund Amount Payable to You:</span>
                    <span className="text-base font-extrabold">{formatINR(refundAmount)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Cancellation Reason Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="Change of travel plans">Change of travel plans</option>
                <option value="Emergency or medical situation">Emergency or medical situation</option>
                <option value="Rescheduling dates">Need to re-book different dates</option>
                <option value="Transport or weather issue in Konkan">Transport or weather delay</option>
                <option value="Other">Other reasons</option>
              </select>
            </div>

            {cancelSuccessMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-900 text-xs rounded-xl font-medium border border-emerald-200">
                {cancelSuccessMsg}
              </div>
            )}

            {/* Dialog Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingCancel}
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Keep Reservation
              </button>

              <button
                type="button"
                disabled={isProcessingCancel || !!cancelSuccessMsg}
                onClick={handleConfirmCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                {isProcessingCancel ? (
                  <span>Processing Cancellation...</span>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: WRITE A REVIEW DIALOG (COMPLETED BOOKINGS ONLY) */}
      {/* ========================================================================= */}
      {reviewingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Review Your Stay</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Completed Stay Banner */}
            <div className="bg-konkan-sand-50 p-3 rounded-2xl border border-konkan-sand-200 text-xs space-y-0.5">
              <span className="font-bold text-slate-900">{reviewingBooking.hotelName}</span>
              <p className="text-konkan-teal-700 font-medium">{reviewingBooking.roomName}</p>
              <p className="text-slate-500 text-[11px]">
                Stayed: {reviewingBooking.checkIn} to {reviewingBooking.checkOut} ({reviewingBooking.nights} nights)
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= (reviewHoverRating || reviewRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {reviewHoverRating === 1 || (!reviewHoverRating && reviewRating === 1)
                      ? "1/5 - Poor"
                      : reviewHoverRating === 2 || (!reviewHoverRating && reviewRating === 2)
                      ? "2/5 - Fair"
                      : reviewHoverRating === 3 || (!reviewHoverRating && reviewRating === 3)
                      ? "3/5 - Good"
                      : reviewHoverRating === 4 || (!reviewHoverRating && reviewRating === 4)
                      ? "4/5 - Very Good"
                      : "5/5 - Exceptional Konkan Stay"}
                  </span>
                </div>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Your Experience & Feedback
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about beach proximity, cleanliness, seafood hospitality, or host communication..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  Between 5 and 1,000 characters. Authentic feedback helps Konkan travelers.
                </span>
              </div>

              {reviewError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {reviewError}
                </div>
              )}

              {reviewSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-medium">
                  {reviewSuccessMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => setReviewingBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingReview || !!reviewSuccessMsg}
                  className="px-5 py-2.5 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingReview ? "Posting Review..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRINTABLE VOUCHER PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-konkan-teal-700" />
                <h3 className="text-lg font-bold text-slate-900">Official Confirmation Voucher</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingVoucher(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Body Preview */}
            <div className="border border-konkan-sand-300 rounded-2xl p-5 space-y-4 bg-slate-50/50">
              <div className="flex justify-between items-start border-b border-dashed border-slate-300 pb-3">
                <div>
                  <div className="text-xl font-black text-konkan-teal-800">
                    bhramo<span className="text-konkan-teal-600">.com</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Dapoli & Harnai Coastal Booking Network</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    ● {previewingVoucher.status.toUpperCase()}
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-700 mt-1">{previewingVoucher.id}</div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Check-in</span>
                  <span className="font-bold text-slate-800">{previewingVoucher.checkIn}</span>
                  <span className="text-[10px] text-slate-400 block">12:00 PM</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Check-out</span>
                  <span className="font-bold text-slate-800">{previewingVoucher.checkOut}</span>
                  <span className="text-[10px] text-slate-400 block">10:00 AM</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Stay</span>
                  <span className="font-bold text-slate-800">{previewingVoucher.nights} Nights</span>
                  <span className="text-[10px] text-slate-400 block">{previewingVoucher.guests} Guests</span>
                </div>
              </div>

              {/* Property & Room */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-base text-slate-900">{previewingVoucher.hotelName}</div>
                <div className="text-konkan-teal-700 font-semibold">{previewingVoucher.roomName}</div>
                <div className="text-slate-500 text-[11px]">{previewingVoucher.address}</div>
                {previewingVoucher.utr && (
                  <div className="text-[11px] font-mono text-slate-600 pt-1">
                    UPI Transaction UTR: <strong>{previewingVoucher.utr}</strong>
                  </div>
                )}
              </div>

              {/* Financials */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Total Booking Amount:</span>
                  <span className="font-bold">{formatINR(previewingVoucher.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance Booking Fee (Paid via UPI):</span>
                  <span className="font-bold">{formatINR(previewingVoucher.advancePaid)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-konkan-teal-900 pt-1.5 border-t border-dashed border-slate-200">
                  <span>Remaining Balance (Pay at Hotel):</span>
                  <span>{formatINR(previewingVoucher.balanceAmount)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                <strong>Arrival Note:</strong> Carry a government photo ID. Balance of {formatINR(previewingVoucher.balanceAmount)} is payable at check-in via cash or UPI.
              </div>
            </div>

            {/* Print & Download Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewingVoucher(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleDownloadVoucher(previewingVoucher)}
                className="px-4 py-2.5 rounded-xl border border-konkan-teal-600 bg-konkan-teal-50 text-konkan-teal-800 text-xs font-bold hover:bg-konkan-teal-100 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save HTML File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const html = generateVoucherHtml({
                    id: previewingVoucher.id,
                    hotelName: previewingVoucher.hotelName,
                    area: previewingVoucher.area,
                    address: previewingVoucher.address,
                    roomName: previewingVoucher.roomName,
                    checkIn: previewingVoucher.checkIn,
                    checkOut: previewingVoucher.checkOut,
                    nights: previewingVoucher.nights,
                    guests: previewingVoucher.guests,
                    totalAmount: previewingVoucher.totalAmount,
                    advancePaid: previewingVoucher.advancePaid,
                    balanceAmount: previewingVoucher.balanceAmount,
                    paymentMethod: previewingVoucher.paymentMethod,
                    utr: previewingVoucher.utr,
                    guestName: profile?.name || "Guest",
                    guestPhone: profile?.phone || "+91 94223 88200",
                    ownerWhatsapp: previewingVoucher.ownerWhatsapp,
                    status: previewingVoucher.status,
                    createdAt: previewingVoucher.createdAt,
                  });
                  const printWin = window.open("", "_blank");
                  if (printWin) {
                    printWin.document.write(html);
                    printWin.document.close();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
