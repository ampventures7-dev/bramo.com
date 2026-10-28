"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  getPlatformSettings,
  updatePlatformSettings,
  adminVerifyBooking,
  adminRejectBooking,
  autoExpireUnverifiedBookings,
  getLedgerRecords,
  addLedgerRecord,
  processCancellationWithPolicy,
  DEFAULT_PLATFORM_SETTINGS
} from "@/lib/manual-payment-service";
import { PlatformSettings, LedgerEntry } from "@/types/supabase";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatINR } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  CreditCard,
  FileText,
  Settings,
  AlertTriangle,
  MessageSquare,
  Search,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  DollarSign,
  TrendingUp,
  UserCheck,
  Zap,
  ShoppingCart,
  Sparkles
} from "lucide-react";

interface PendingPaymentItem {
  id: string;
  guestName: string;
  guestPhone: string;
  hotelName: string;
  hotelArea: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  bookingFeeAmount: number;
  balanceAmount: number;
  upiRefNumber: string;
  screenshotUrl?: string;
  status: "pending_verification" | "confirmed" | "cancelled" | "requested";
  verificationExpiresAt?: number;
}

const INITIAL_MOCK_PENDING: PendingPaymentItem[] = [];

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"pending" | "ledger" | "settings" | "cancellations" | "abandoned">("pending");

  // Pending payments state
  const [pendingList, setPendingList] = useState<PendingPaymentItem[]>(INITIAL_MOCK_PENDING);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Bank SMS / Notification Quick-Paster (Feature 7)
  const [pastedSmsText, setPastedSmsText] = useState<string>("");
  const [parsedSmsResult, setParsedSmsResult] = useState<{
    utr?: string;
    amount?: number;
    matchedBooking?: PendingPaymentItem;
  } | null>(null);

  // Abandoned / Expired Holds (Feature 8)
  const [abandonedList, setAbandonedList] = useState<any[]>([]);

  // Settings state
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Ledger state
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  // Verification modal / feedback
  const [verificationFeedback, setVerificationFeedback] = useState<{
    bookingId: string;
    waLink: string;
    guestPhone: string;
  } | null>(null);

  // Route protection: Only admins allowed
  useEffect(() => {
    if (!isLoading) {
      if (!profile) {
        router.push("/login");
      } else if (profile.role !== "admin") {
        router.push(profile.role === "owner" ? "/owner/dashboard" : "/my-bookings");
      }
    }
  }, [profile, isLoading, router]);

  // Load data & run auto-expiry
  useEffect(() => {
    async function init() {
      // Run 6-hour auto expiry check
      autoExpireUnverifiedBookings();

      // Load settings
      const s = await getPlatformSettings();
      setSettings(s);

      // Load ledger
      setLedgerEntries(getLedgerRecords());

      // Sync active holds from storage if present
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("bhramo_active_booking_holds");
          if (raw) {
            const parsed = JSON.parse(raw);
            const pending = parsed.filter((h: any) => h.status === "pending_verification");
            if (pending.length > 0) {
              setPendingList((prev) => {
                const map = new Map();
                [...prev, ...pending].forEach((item) => map.set(item.id, item));
                return Array.from(map.values());
              });
            }
          }
        } catch {
          // ignore
        }
      }

      // Query Supabase database for all real-time pending verification bookings
      if (isSupabaseConfigured) {
        try {
          const { data: dbPending, error } = await supabase
            .from("bookings")
            .select(`
              id,
              hotel_id,
              room_type_id,
              guest_id,
              check_in,
              check_out,
              total_amount,
              booking_fee_amount,
              balance_amount,
              utr,
              screenshot_url,
              status,
              verification_expires_at,
              hotels:hotel_id (name, area),
              room_types:room_type_id (name),
              profiles:guest_id (name, phone)
            `)
            .eq("status", "pending_verification");

          if (!error && dbPending && dbPending.length > 0) {
            const mapped: PendingPaymentItem[] = dbPending.map((b: any) => ({
              id: b.id,
              guestName: b.profiles?.name || "Guest",
              guestPhone: b.profiles?.phone || "",
              hotelName: b.hotels?.name || "Coastal Hotel",
              hotelArea: b.hotels?.area || "Dapoli",
              roomName: b.room_types?.name || "Deluxe Room",
              checkIn: b.check_in,
              checkOut: b.check_out,
              totalAmount: Number(b.total_amount),
              bookingFeeAmount: Number(b.booking_fee_amount || Math.round(Number(b.total_amount) * 0.15)),
              balanceAmount: Number(b.balance_amount || Math.round(Number(b.total_amount) * 0.85)),
              upiRefNumber: b.utr || "Pending",
              screenshotUrl: b.screenshot_url || undefined,
              status: b.status,
              verificationExpiresAt: b.verification_expires_at ? new Date(b.verification_expires_at).getTime() : undefined,
            }));

            setPendingList((prev) => {
              const map = new Map();
              [...mapped, ...prev].forEach((item) => map.set(item.id, item));
              return Array.from(map.values());
            });
          }
        } catch (e) {
          console.warn("Supabase pending payments fetch fallback:", e);
        }
      }
    }

    init();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-konkan-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || profile.role !== "admin") {
    return null;
  }

  // Handle Verify Action (Requirement 4)
  const handleVerify = async (bookingId: string) => {
    const res = await adminVerifyBooking(bookingId);
    if (res.success) {
      setPendingList((prev) => prev.filter((p) => p.id !== bookingId));
      setLedgerEntries(getLedgerRecords());
      setVerificationFeedback({
        bookingId,
        waLink: res.waLink,
        guestPhone: res.guestPhone,
      });
    }
  };

  // Handle Reject Action (Requirement 4)
  const handleReject = async (bookingId: string) => {
    if (!confirm(`Reject booking ${bookingId} and release held rooms?`)) return;
    await adminRejectBooking(bookingId, "UTR verification rejected by admin");
    setPendingList((prev) => prev.filter((p) => p.id !== bookingId));
  };

  // Feature 7: Bank SMS / UPI Credit Notification Auto-Parser
  const handleParseBankSms = (text: string) => {
    setPastedSmsText(text);
    if (!text.trim()) {
      setParsedSmsResult(null);
      return;
    }

    const utrMatch = text.match(/\b(\d{12})\b/);
    const amtMatch = text.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i);
    const utr = utrMatch ? utrMatch[1] : undefined;
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : undefined;

    const matched = utr ? pendingList.find((p) => p.upiRefNumber === utr) : undefined;
    setParsedSmsResult({ utr, amount, matchedBooking: matched });
  };

  // Feature 8: WhatsApp Abandonment Follow-up Link Generator
  const getFollowUpWaLink = (item: any) => {
    const rawPhone = item.guestPhone || "919876543210";
    const phone = rawPhone.replace(/[^0-9]/g, "");
    const msg = `*Namaskar ${item.guestName || "Guest"}! — bhramo.com*
--------------------------------
We noticed your booking hold for *${item.hotelName || "Coastal Stay"}* in *${item.hotelArea || "Dapoli"}* (${item.checkIn || "Upcoming Dates"}) was not completed.

Rooms fill up fast for weekends in Dapoli! If you had trouble with the UPI QR code or need help choosing dates, reply to this message and our local team will be happy to assist you.
--------------------------------
bhramo.com Coastal Team`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  // Handle Settings Save (Requirement 1)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await updatePlatformSettings(settings);
    setSettings(updated);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Calculations for ledger
  const totalReceived = ledgerEntries
    .filter((l) => l.type === "received")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  const totalRefunds = ledgerEntries
    .filter((l) => l.type === "refund")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  const totalPayouts = ledgerEntries
    .filter((l) => l.type === "payout")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-konkan-sand-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>bhramo.com Admin Finance & Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Manual UPI Verifications & Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Zero Payment Gateway · Direct UTR Audits · 6-Hour Auto-Expiry Window
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/owner/dashboard"
            className="px-3.5 py-2 rounded-xl border border-konkan-sand-300 bg-white hover:bg-konkan-sand-50 text-slate-700 font-bold text-xs"
          >
            Host Dashboard
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-konkan-sand-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-konkan-teal-700 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-konkan-sand-100 border border-konkan-sand-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Verifications</span>
          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
            {pendingList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "ledger"
              ? "bg-konkan-teal-700 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-konkan-sand-100 border border-konkan-sand-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Financial Ledger</span>
          <span className="text-[10px] text-slate-500">({ledgerEntries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "settings"
              ? "bg-konkan-teal-700 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-konkan-sand-100 border border-konkan-sand-200"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Platform Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cancellations")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "cancellations"
              ? "bg-konkan-teal-700 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-konkan-sand-100 border border-konkan-sand-200"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Cancellation Policy & Refunds</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("abandoned")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "abandoned"
              ? "bg-purple-700 text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-konkan-sand-100 border border-konkan-sand-200"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Abandoned Holds & Nudge</span>
          <span className="bg-purple-100 text-purple-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {abandonedList.length}
          </span>
        </button>
      </div>

      {/* Verification Success / WhatsApp Dialog */}
      {verificationFeedback && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Booking {verificationFeedback.bookingId} Verified & Confirmed!</span>
            </div>
            <button
              onClick={() => setVerificationFeedback(null)}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-emerald-800">
            Ledger entry recorded. Send the guest their official confirmation receipt and balance notice via WhatsApp:
          </p>
          <div>
            <a
              href={verificationFeedback.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Confirmation WhatsApp to Guest ({verificationFeedback.guestPhone})</span>
            </a>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: PENDING MANUAL UPI VERIFICATIONS (Requirement 4) */}
      {/* ========================================================= */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {/* Feature 7: Quick Paste Bank SMS / UPI Notification Auto-Matcher */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Bank SMS & Credit Notification Quick-Paster
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Regex 12-Digit Auto-Matcher
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Paste bank notification e.g.: A/C credited with Rs 780.00 on 11-Oct-26 by UPI/419827361829..."
                value={pastedSmsText}
                onChange={(e) => handleParseBankSms(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />

              {pastedSmsText && (
                <button
                  type="button"
                  onClick={() => {
                    setPastedSmsText("");
                    setParsedSmsResult(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {parsedSmsResult && (
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Extracted UTR:</span>
                    <strong className="font-mono text-amber-300 font-black">
                      {parsedSmsResult.utr || "None Detected"}
                    </strong>
                    {parsedSmsResult.amount && (
                      <span className="text-emerald-400 font-bold">
                        (₹{parsedSmsResult.amount})
                      </span>
                    )}
                  </div>
                  {parsedSmsResult.matchedBooking ? (
                    <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        Found Match: {parsedSmsResult.matchedBooking.id} · {parsedSmsResult.matchedBooking.guestName} ({parsedSmsResult.matchedBooking.hotelName})
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      {parsedSmsResult.utr ? "No pending reservation matches this UTR." : "Paste a message containing a 12-digit UPI reference."}
                    </span>
                  )}
                </div>

                {parsedSmsResult.matchedBooking && (
                  <button
                    type="button"
                    onClick={() => handleVerify(parsedSmsResult.matchedBooking!.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve {parsedSmsResult.matchedBooking.id} Now</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-500">
              Unverified bookings automatically expire after <strong>6 hours</strong> and release the held rooms.
            </div>
            <span className="text-xs font-bold text-slate-700 bg-konkan-sand-100 px-3 py-1 rounded-full border border-konkan-sand-200">
              {pendingList.length} Pending Actions
            </span>
          </div>

          {pendingList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-konkan-sand-200 shadow-sm space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">All Payments Cleared</h3>
              <p className="text-xs text-slate-500">No pending UPI UTRs requiring verification.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingList.map((item) => {
                const hoursLeft = item.verificationExpiresAt
                  ? Math.max(0, Math.round((item.verificationExpiresAt - Date.now()) / (3600 * 1000)))
                  : 6;

                return (
                  <div
                    key={item.id}
                    className="p-6 bg-white rounded-3xl border border-konkan-sand-200 shadow-sm hover:border-konkan-teal-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-konkan-sand-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">
                          Booking ID: <strong className="text-slate-800">{item.id}</strong>
                        </span>
                        <h3 className="font-bold text-base text-slate-900">{item.hotelName}</h3>
                        <span className="text-xs text-konkan-teal-700 font-medium">
                          {item.roomName} · 📍 {item.hotelArea}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Expires in ~{hoursLeft} hours</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                      {/* Guest Details */}
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block">
                          Guest Details
                        </span>
                        <strong className="text-slate-800 block text-sm">{item.guestName}</strong>
                        <span className="text-slate-500">{item.guestPhone}</span>
                        <span className="text-slate-500 block">
                          {item.checkIn} &rarr; {item.checkOut}
                        </span>
                      </div>

                      {/* Financial Amounts (Requirement 2 & 7) */}
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block">
                          Financials
                        </span>
                        <div>
                          Total Booking: <strong>{formatINR(item.totalAmount)}</strong>
                        </div>
                        <div className="text-emerald-700 font-bold">
                          Booking Fee (Advance): {formatINR(item.bookingFeeAmount)}
                        </div>
                        <div className="text-amber-800 font-semibold">
                          Balance at Hotel: {formatINR(item.balanceAmount)}
                        </div>
                      </div>

                      {/* Submitted UTR */}
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block">
                          Submitted 12-Digit UTR
                        </span>
                        <div className="font-mono font-black text-sm bg-konkan-sand-50 p-2 rounded-xl border border-konkan-sand-300 text-slate-900 select-all inline-block mt-0.5">
                          {item.upiRefNumber}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Check Bank statement / UPI App
                        </span>
                      </div>

                      {/* Screenshot */}
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] block">
                          Payment Screenshot
                        </span>
                        {item.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedScreenshot(item.screenshotUrl || null)}
                            className="mt-1 group relative h-16 w-24 rounded-xl overflow-hidden border border-konkan-sand-300 block hover:opacity-90"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.screenshotUrl}
                              alt="Payment Screenshot"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute inset-0 bg-black/40 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              View Full
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic block mt-1">No screenshot attached</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons (Requirement 4) */}
                    <div className="pt-3 border-t border-konkan-sand-100 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Payment</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVerify(item.id)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Confirm Booking</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FINANCIAL LEDGER VIEW (Requirement 5) */}
      {/* ========================================================= */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-konkan-sand-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Advance Fees Received
              </span>
              <div className="text-2xl font-black text-emerald-700">{formatINR(totalReceived)}</div>
              <p className="text-[11px] text-slate-500">Collected via manual UPI</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-konkan-sand-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Manual Refunds Recorded
              </span>
              <div className="text-2xl font-black text-rose-700">{formatINR(totalRefunds)}</div>
              <p className="text-[11px] text-slate-500">Processed per cancellation policy</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-konkan-sand-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Host Payouts Settled
              </span>
              <div className="text-2xl font-black text-konkan-teal-900">{formatINR(totalPayouts)}</div>
              <p className="text-[11px] text-slate-500">Net platform settlements</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-3xl border border-konkan-sand-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-konkan-sand-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Ledger Transactions</h3>
                <p className="text-xs text-slate-500">Complete audit log of all manual financial transactions</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {ledgerEntries.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-konkan-sand-50/70 border-b border-konkan-sand-200 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">UTR Reference</th>
                    <th className="py-3 px-4">Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-konkan-sand-100 text-slate-700">
                  {ledgerEntries.map((row) => (
                    <tr key={row.id} className="hover:bg-konkan-sand-50/50">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString()} {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                            row.type === "received"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.type === "refund"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {row.booking_id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatINR(Number(row.amount))}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {row.utr || "Pending Transfer"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PLATFORM SETTINGS (Requirement 1) */}
      {/* ========================================================= */}
      {activeTab === "settings" && (
        <div className="bg-white p-7 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Platform Payment Settings</h3>
            <p className="text-xs text-slate-500">
              Configure your platform UPI ID, QR image, business name, and default booking fee percentage.
            </p>
          </div>

          {settingsSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings successfully updated and saved!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Business Name */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Business / Entity Name
              </label>
              <input
                type="text"
                required
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                className="w-full p-2.5 border border-konkan-sand-300 rounded-xl bg-white font-medium focus:ring-1 focus:ring-konkan-teal-600 focus:outline-none"
              />
            </div>

            {/* Platform UPI ID */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Platform UPI ID (Receiving Account)
              </label>
              <input
                type="text"
                required
                value={settings.upi_id}
                onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                className="w-full p-2.5 border border-konkan-sand-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-konkan-teal-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Shown to guests at checkout for direct UPI transfer.
              </span>
            </div>

            {/* Booking Fee Percent */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                Default Booking Fee Percentage (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={settings.default_booking_fee_percent}
                  onChange={(e) =>
                    setSettings({ ...settings, default_booking_fee_percent: Number(e.target.value) })
                  }
                  className="w-32 p-2.5 border border-konkan-sand-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-1 focus:ring-konkan-teal-600 focus:outline-none"
                />
                <span className="text-slate-500 font-semibold">%</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default is 15%. Applied at checkout unless overridden per hotel. Remaining amount is collected at the hotel.
              </span>
            </div>

            {/* Dummy QR Code Image URL */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
                QR Code Image URL (Dummy QR Preview Available)
              </label>
              <input
                type="url"
                required
                value={settings.qr_image_url}
                onChange={(e) => setSettings({ ...settings, qr_image_url: e.target.value })}
                className="w-full p-2.5 border border-konkan-sand-300 rounded-xl bg-white text-xs font-mono focus:ring-1 focus:ring-konkan-teal-600 focus:outline-none"
              />
            </div>

            {/* Current QR Preview */}
            <div className="p-4 bg-konkan-sand-50 rounded-2xl border border-konkan-sand-200 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.qr_image_url}
                alt="UPI QR Preview"
                className="w-24 h-24 object-contain bg-white p-2 rounded-xl border border-konkan-sand-300"
              />
              <div className="space-y-1">
                <span className="font-bold text-slate-800 text-xs">Current Active QR Preview</span>
                <p className="text-[11px] text-slate-500">
                  You can update this later with your live official bank UPI QR image.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Save Platform Settings
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: CANCELLATIONS & MANUAL REFUND ENTRY (Requirement 6) */}
      {/* ========================================================= */}
      {activeTab === "cancellations" && (
        <div className="bg-white p-7 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Cancellation Rules & Manual Refunds</h3>
            <p className="text-xs text-slate-500">
              Apply platform cancellation policy rules and record manual refund payouts for administration.
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-xs text-amber-900">
            <h4 className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Platform Cancellation Policy</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-800">
              <li>
                <strong>Cancellations &gt; 48 hours before check-in:</strong> Guest is eligible for 95% refund of their paid booking fee (5% retained for administrative/banking costs).
              </li>
              <li>
                <strong>Cancellations &lt; 48 hours before check-in:</strong> Non-refundable as rooms were held and withheld from other Konkan travelers.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900">Sample Cancellation Request</h4>
            <div className="p-4 rounded-2xl border border-konkan-sand-200 bg-konkan-sand-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm">Booking bk-902 (Guest: Sneha Rao)</span>
                <div className="text-slate-500">
                  Property: Suvarnadurg Coastal Haven · Check-in: 05 Nov 2026 (18 days away)
                </div>
                <div className="text-slate-600">
                  Booking Fee Paid: <strong>₹720</strong> · Status: <span className="font-bold text-rose-700">Cancelled by Guest</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const res = await processCancellationWithPolicy({
                    bookingId: "bk-902",
                    checkInDate: "2026-11-05",
                    feeAmount: 720,
                    reason: "Guest travel emergency",
                  });
                  setLedgerEntries(getLedgerRecords());
                  alert(`Policy applied: ${res.policyNote}\nRecorded refund entry of ₹${res.refundAmount} in ledger.`);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors self-start sm:self-auto"
              >
                Apply Policy & Record Refund in Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ABANDONED HOLDS & WHATSAPP FOLLOW-UP (Feature 8)   */}
      {/* ========================================================= */}
      {activeTab === "abandoned" && (
        <div className="space-y-5">
          <div className="bg-purple-50 p-6 rounded-3xl border border-purple-200 text-purple-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-purple-900">
              <ShoppingCart className="w-5 h-5 text-purple-700" />
              <span>Checkout Abandonment Recovery System</span>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed max-w-3xl">
              Guests who initiated a 10-minute hold but did not submit their UPI UTR code before window expiration. Because high-season Konkan rooms sell out quickly, a prompt, helpful WhatsApp follow-up often converts undecided travelers into confirmed bookings.
            </p>
          </div>

          <div className="space-y-3">
            {abandonedList.map((item) => {
              const waFollowUpLink = getFollowUpWaLink(item);

              return (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-3xl border border-konkan-sand-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.guestName}</span>
                      <span className="font-mono text-xs text-slate-500">({item.guestPhone})</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        Expired Hold
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong>{item.hotelName}</strong> ({item.hotelArea}) · {item.roomName}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Dates: {item.checkIn} to {item.checkOut} · Total: <strong>{formatINR(item.totalAmount)}</strong> · Held at {item.createdAt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={waFollowUpLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send WhatsApp Nudge</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshot && (
        <div
          onClick={() => setSelectedScreenshot(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="max-w-md w-full bg-white p-3 rounded-2xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedScreenshot}
              alt="Payment Full Screenshot"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-500 mt-2">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
