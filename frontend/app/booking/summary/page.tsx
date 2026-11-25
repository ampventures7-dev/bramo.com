"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getBookingHold,
  fetchBookingHold,
  BookingHoldRecord
} from "@/lib/booking-service";
import {
  getPlatformSettings,
  calculateBookingFee,
  submitUpiForVerification,
  DEFAULT_PLATFORM_SETTINGS
} from "@/lib/manual-payment-service";
import { compressImageUnder300KB } from "@/lib/image-compression";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { PlatformSettings } from "@/types/supabase";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { extractUtrFromScreenshot } from "@/lib/client-ocr";
import {
  Clock,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Copy,
  Info,
  Building2,
  Image as ImageIcon,
  Lock,
  Sparkles,
  MessageSquare,
  Phone
} from "lucide-react";

export default function BookingSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const { user, profile, isLoading: isAuthLoading } = useAuth();

  const [booking, setBooking] = useState<BookingHoldRecord | null>(null);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins hold
  const [isHoldExpired, setIsHoldExpired] = useState<boolean>(false);

  // UTR & Screenshot inputs
  const [utr, setUtr] = useState<string>("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [persistentScreenshotUrl, setPersistentScreenshotUrl] = useState<string | null>(null);
  const [screenshotCompressing, setScreenshotCompressing] = useState<boolean>(false);
  const [copiedNote, setCopiedNote] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Client-Side OCR States (Point 2: Zero API Cost Auto-Reader)
  const [ocrScanning, setOcrScanning] = useState<boolean>(false);
  const [ocrDetectedUtr, setOcrDetectedUtr] = useState<string | null>(null);

  // QR Mode: Dynamic amount pre-filled QR vs Official Prachi Pawar GPay QR Card
  const [qrMode, setQrMode] = useState<"dynamic" | "official">("dynamic");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load booking and platform settings
  useEffect(() => {
    async function loadData() {
      if (!bookingId) {
        router.push("/hotels");
        return;
      }

      const hold = await fetchBookingHold(bookingId);
      if (!hold) {
        setErrorMessage("Reservation record not found or hold has expired.");
        return;
      }

      setBooking(hold);

      const loadedSettings = await getPlatformSettings();
      setSettings(loadedSettings);

      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((hold.holdExpiresAt - now) / 1000));
      setSecondsRemaining(diffSeconds);

      if (diffSeconds <= 0 || hold.status === "cancelled") {
        setIsHoldExpired(true);
      }
    }

    loadData();
  }, [bookingId, router]);

  // Hold countdown
  useEffect(() => {
    if (isHoldExpired || !booking) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((booking.holdExpiresAt - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        setIsHoldExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking, isHoldExpired]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Image upload handling with under 300KB compression and persistent storage
  const handleScreenshotSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScreenshotCompressing(true);
      const compressed = await compressImageUnder300KB(file);
      const previewUrl = URL.createObjectURL(compressed);
      setScreenshotPreview(previewUrl);

      // Point 2: Run Client-Side OCR Auto-Reader in Background (Zero API Cost)
      setOcrScanning(true);
      extractUtrFromScreenshot(compressed)
        .then((ocrRes) => {
          setOcrScanning(false);
          if (ocrRes.success && ocrRes.utr) {
            setUtr(ocrRes.utr);
            setOcrDetectedUtr(ocrRes.utr);
          }
        })
        .catch(() => setOcrScanning(false));

      // Upload to Supabase Storage bucket payment-receipts if configured
      if (isSupabaseConfigured) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const filename = `receipt-${booking?.id || Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(filename, compressed, { contentType: compressed.type, upsert: true });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from("payment-receipts")
            .getPublicUrl(filename);
          if (publicData?.publicUrl) {
            setPersistentScreenshotUrl(publicData.publicUrl);
          }
        }
      }
    } catch (err) {
      console.error("Screenshot compression/upload error:", err);
    } finally {
      setScreenshotCompressing(false);
    }
  };

  const copyToClipboard = (text: string, type: "note" | "upi") => {
    navigator.clipboard.writeText(text);
    if (type === "note") {
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    } else {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Handle Submission of UTR
  const handleSubmitUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    if (isHoldExpired) {
      alert("The 15-minute hold has expired. Rooms have been released.");
      return;
    }

    const cleanUtr = utr.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMessage("Please enter a valid 12-digit numeric UPI UTR / Transaction ID.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitUpiForVerification({
      bookingId: booking.id,
      utr: cleanUtr,
      screenshotUrl: persistentScreenshotUrl || screenshotPreview || undefined,
      hotelName: booking.hotelName,
      hotelArea: booking.hotelArea,
      roomName: booking.roomName,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      advanceAmount: bookingFee,
      balanceAmount: balanceAmount,
    });

    setIsSubmitting(false);

    if (res.success) {
      // Redirect to Confirmation / Pending Status Screen
      router.push(`/booking/confirmation/${booking.id}`);
    } else {
      setErrorMessage(res.error || "Failed to submit verification.");
    }
  };

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Booking Session Not Found</h2>
        <p className="text-xs text-slate-500">
          This booking session may have timed out or does not exist.
        </p>
        <Link
          href="/hotels"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-konkan-teal-700 text-white text-xs font-bold"
        >
          <span>Return to Hotels</span>
        </Link>
      </div>
    );
  }

  // Requirement 2: Compute booking_fee = total_amount * booking_fee_percent (default 15)
  const { feePercent, bookingFee, balanceAmount } = calculateBookingFee(
    booking.totalAmount,
    null, // falls back to platform default
    settings.default_booking_fee_percent
  );

  const dynamicUpiDeepLink = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.business_name)}&am=${bookingFee}&cu=INR&tn=${encodeURIComponent(`Booking ${booking.id}`)}`;
  const gpayDeepLink = `gpay://upi/pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.business_name)}&am=${bookingFee}&cu=INR&tn=${encodeURIComponent(`Booking ${booking.id}`)}`;
  const phonepeDeepLink = `phonepe://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.business_name)}&am=${bookingFee}&cu=INR&tn=${encodeURIComponent(`Booking ${booking.id}`)}`;
  const paytmDeepLink = `paytmmp://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.business_name)}&am=${bookingFee}&cu=INR&tn=${encodeURIComponent(`Booking ${booking.id}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(dynamicUpiDeepLink)}`;

  // Point 4: Co-Founder WhatsApp Concierge Pre-filled Message
  const conciergePhone = "917447568595";
  const conciergeWaMessage = `*🏖️ Booking Payment Receipt — bhramo.com*
--------------------------------
*Booking ID:* ${booking.id}
*Hotel / Homestay:* ${booking.hotelName} (${booking.roomName})
*Dates:* ${booking.checkIn} to ${booking.checkOut}
*Guest:* ${booking.guestName || "Guest"} (${booking.guestPhone || "Direct"})
*Advance Amount (20%):* ${formatINR(bookingFee)}
${utr ? `*12-Digit UTR:* ${utr}` : "*Payment Note:* I have completed the UPI advance payment."}
--------------------------------
Hi Prachii, please verify my payment screenshot and confirm my reservation. Thank you!`;
  const conciergeWaLink = `https://wa.me/${conciergePhone}?text=${encodeURIComponent(conciergeWaMessage)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-konkan-sand-200 pb-5">
        <div>
          <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            Step 2 of 3 · Manual UPI Verification
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Pay Booking Advance ({feePercent}%)
          </h1>
          <p className="text-xs text-slate-500">
            Booking ID: <strong className="font-mono text-slate-800 font-bold">{booking.id}</strong>
          </p>
        </div>

        {/* 10-Minute Hold Badge */}
        <div
          className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 self-start sm:self-auto shadow-sm ${
            isHoldExpired
              ? "bg-rose-50 border-rose-300 text-rose-800"
              : secondsRemaining < 120
              ? "bg-amber-50 border-amber-300 text-amber-900 animate-pulse"
              : "bg-konkan-teal-50 border-konkan-teal-300 text-konkan-teal-900"
          }`}
        >
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider">
              {isHoldExpired ? "Hold Expired" : "15-Min Hold Window"}
            </div>
            <div className="font-mono text-base font-black">
              {isHoldExpired ? "00:00" : formatTimer(secondsRemaining)}
            </div>
          </div>
        </div>
      </div>

      {isHoldExpired && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Hold Expired — Rooms Released</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-700">
            The 15-minute hold window for this reservation has ended. To avoid double booking, rooms have been released. Please return and select your dates again.
          </p>
          <div className="pt-2">
            <Link
              href={`/hotels/${booking.hotelId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Select Dates Again at {booking.hotelName}</span>
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ========================================================= */}
        {/* LEFT 2 COLS: MANUAL UPI PAYMENT & UTR SUBMISSION */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* Platform QR & UPI Instructions (Requirement 2) */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-konkan-sand-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Scan Platform UPI QR</h2>
                <p className="text-xs text-slate-500">Pay directly via any UPI App (GPay, PhonePe, Paytm, BHIM)</p>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                No Gateway · Zero Convenience Fee
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-5 bg-konkan-sand-50/70 rounded-2xl border border-konkan-sand-200">
              {/* QR Code Block (Desktop / Scanner) with Dual Mode Toggle */}
              <div className="p-3 bg-white rounded-2xl border border-konkan-sand-300 shadow-sm shrink-0 text-center w-full sm:w-auto space-y-2">
                {/* QR Mode Toggle */}
                <div className="flex items-center justify-center gap-1 p-1 bg-konkan-sand-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQrMode("dynamic")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      qrMode === "dynamic"
                        ? "bg-white text-konkan-teal-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ⚡ Auto-Fill QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode("official")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      qrMode === "official"
                        ? "bg-white text-konkan-teal-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    📷 Official GPay QR
                  </button>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrMode === "dynamic" ? qrCodeUrl : "/qr/bhramo-official-qr.png"}
                  alt={qrMode === "dynamic" ? "Dynamic Amount UPI QR Code" : "Official Prachi Pawar GPay QR"}
                  className="w-44 h-44 object-contain mx-auto rounded-lg"
                />

                <div className="pt-0.5">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Prachi Pawar
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    {qrMode === "dynamic" ? "Auto-fills exact advance" : "Official Google Pay QR"}
                  </span>
                </div>
              </div>

              {/* UPI & 1-Tap App Launchers Block */}
              <div className="space-y-3.5 flex-1 w-full text-xs">
                {/* Amount Payable Now */}
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">
                    Advance Payable Now ({feePercent}% to Lock Room)
                  </span>
                  <div className="text-2xl font-black text-emerald-950 mt-0.5">
                    {formatINR(bookingFee)}
                  </div>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Remaining balance of <strong>{formatINR(balanceAmount)}</strong> will be paid directly at the hotel desk upon check-in.
                  </span>
                </div>

                  {/* 1-Tap UPI App Launchers (Mobile First: Point 3) */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                        ⚡ 1-Tap Fast Pay on Mobile:
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Zero Fee
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={gpayDeepLink}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:border-slate-400 transition-all active:scale-[0.98]"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span>Google Pay</span>
                      </a>

                      <a
                        href={phonepeDeepLink}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:border-slate-400 transition-all active:scale-[0.98]"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                        <span>PhonePe</span>
                      </a>

                      <a
                        href={paytmDeepLink}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:border-slate-400 transition-all active:scale-[0.98]"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                        <span>Paytm</span>
                      </a>

                      <a
                        href={dynamicUpiDeepLink}
                        className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Any UPI App</span>
                      </a>
                    </div>
                  </div>

                {/* Platform UPI ID */}
                <div className="pt-1">
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">
                    Platform UPI ID (for manual entry)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-konkan-sand-300 select-all">
                      {settings.upi_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings.upi_id, "upi")}
                      className="p-1.5 text-xs text-konkan-teal-700 hover:bg-konkan-sand-100 rounded-lg flex items-center gap-1 border border-konkan-sand-200 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedUpi ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Booking ID Note */}
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[10px]">
                    Payment Note / Reference (Must Include)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-xs text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-konkan-sand-300 select-all">
                      {booking.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(booking.id, "note")}
                      className="p-1.5 text-xs text-konkan-teal-700 hover:bg-konkan-sand-100 rounded-lg flex items-center gap-1 border border-konkan-sand-200 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedNote ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Business Name: <strong className="text-slate-700">{settings.business_name}</strong>
                </div>
              </div>
            </div>

            {/* Step 3: Enter 12-digit UTR & Screenshot Form */}
            <form onSubmit={handleSubmitUpi} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  12-Digit UTR / Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="e.g. 419827361829"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-3 border border-konkan-sand-300 rounded-xl text-base font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-konkan-teal-600 tracking-wider"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Found in your UPI app receipt (Google Pay, PhonePe, Paytm, or BHIM) as &ldquo;UPI Ref ID&rdquo; or &ldquo;UTR&rdquo;.
                </span>
              </div>

              {/* Optional Screenshot */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  Optional Payment Screenshot
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-konkan-sand-100 hover:bg-konkan-sand-200 border border-konkan-sand-300 text-xs font-semibold text-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-konkan-teal-700" />
                    <span>Upload Screenshot</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotSelect}
                      className="hidden"
                    />
                  </label>
                  {screenshotCompressing && (
                    <span className="text-xs text-konkan-teal-700 animate-pulse font-medium">
                      Compressing image under 300 KB...
                    </span>
                  )}
                  {screenshotPreview && (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Screenshot Attached</span>
                    </span>
                  )}
                </div>

                {/* Point 2: Zero API Cost Client-Side OCR Status */}
                {ocrScanning && (
                  <div className="mt-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Reading 12-digit UTR from receipt using on-device OCR (₹0 API cost)...</span>
                  </div>
                )}

                {ocrDetectedUtr && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Auto-detected 12-digit UTR: <strong className="font-mono">{ocrDetectedUtr}</strong> (Auto-filled)
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase">
                      OCR Extracted
                    </span>
                  </div>
                )}

                {screenshotPreview && (
                  <div className="mt-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotPreview}
                      alt="Payment Screenshot Preview"
                      className="h-28 rounded-xl object-cover border border-konkan-sand-300 shadow-sm"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isHoldExpired || isSubmitting || utr.length !== 12}
                  className="w-full py-3.5 px-4 rounded-2xl bg-konkan-teal-700 hover:bg-konkan-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Submitting for Verification...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit UTR for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Status will be set to &ldquo;pending_verification&rdquo;. Auto-expires in 6 hours if unverified.
                </p>
              </div>
            </form>

            {/* Point 4: 1-Tap WhatsApp Screenshot Concierge Card */}
            <div className="pt-4 border-t border-konkan-sand-200">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                        Prefer Sending Screenshot on WhatsApp?
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Direct Desk: Co-Founder Prachii Pawar (+91 74475 68595)
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white/80 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    ~2 min reply
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  If you prefer not typing the UTR, simply send your payment screenshot directly to our Co-Founder on WhatsApp. Our team will verify and lock your room instantly!
                </p>

                <a
                  href={conciergeWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Screenshot to Prachii on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT 1 COL: PRICE BREAKDOWN & REMAINING AT HOTEL */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-konkan-sand-200 shadow-lg space-y-5 sticky top-24">
            <h3 className="font-bold text-base text-slate-900 border-b border-konkan-sand-100 pb-3">
              Payment & Balance Summary
            </h3>

            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium block">{booking.hotelName}</span>
              <span className="font-bold text-sm text-slate-800 block">{booking.roomName}</span>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                <span>{booking.roomsCount} {booking.roomsCount === 1 ? "Room" : "Rooms"}</span>
                <span>·</span>
                <span>{booking.guestsCount} {booking.guestsCount === 1 ? "Guest" : "Guests"}</span>
              </div>
              <span className="text-[11px] text-konkan-teal-700 block">
                {booking.checkIn} &rarr; {booking.checkOut}
              </span>
              {booking.guestName && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Reserved for:</span>
                  <span className="font-bold text-slate-900">{booking.guestName} ({booking.guestPhone})</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2 border-t border-konkan-sand-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Stay Cost:</span>
                <span className="font-bold text-slate-800">{formatINR(booking.totalAmount)}</span>
              </div>

              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1">
                <div className="flex justify-between font-bold text-emerald-950">
                  <span>Payable Now (Advance {feePercent}%):</span>
                  <span>{formatINR(bookingFee)}</span>
                </div>
                <span className="text-[10px] text-emerald-700 block">
                  Secures your room hold via direct host UPI
                </span>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1">
                <div className="flex justify-between font-bold text-amber-950">
                  <span>Pay at Hotel Desk on Check-in (80%):</span>
                  <span>{formatINR(balanceAmount)}</span>
                </div>
                <span className="text-[10px] text-amber-800 block">
                  To be paid directly upon arrival via UPI or cash
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 text-center">
              Protected by bhramo.com Manual Verification · 0% Gateway Commissions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
