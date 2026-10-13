"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import {
  AdminHotelItem,
  AdminBookingItem,
  AdminUserItem,
  AdminPlatformStats,
  getAdminHotels,
  getAdminBookings,
  getAdminUsers,
  computeAdminStats,
  updateHotelStatus,
  updateHotelCommissionRate,
  updateUserRole,
  updateOwnerApprovalStatus,
} from "@/lib/admin-service";
import { OwnerApprovalStatus } from "@/types/supabase";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Percent,
  MapPin,
  CreditCard,
  Search,
  Filter,
  Shield,
  Star,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  DollarSign,
  LayoutDashboard,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Printer,
  Hotel as HotelIcon
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "hotels" | "bookings" | "host_approvals" | "users" | "reports">("overview");

  // Data States
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [hotels, setHotels] = useState<AdminHotelItem[]>([]);
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);

  // Filter States
  const [hotelFilter, setHotelFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [hostApprovalFilter, setHostApprovalFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");

  // Inline Editing States for Commission Rate
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState<string>("");

  // Feedback notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [selectedSettlementHotelId, setSelectedSettlementHotelId] = useState<string>("");

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

  // Load Admin Data
  const refreshAdminData = () => {
    setHotels(getAdminHotels());
    setBookings(getAdminBookings());
    setUsers(getAdminUsers());
    setStats(computeAdminStats());
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

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

  // 1. Approve / Reject Hotel Handlers
  const handleUpdateHotelStatus = async (hotelId: string, status: "approved" | "rejected" | "pending") => {
    const res = await updateHotelStatus(hotelId, status);
    if (res.success) {
      refreshAdminData();
      showNotification(`Hotel listing ${status === "approved" ? "APPROVED" : status === "rejected" ? "REJECTED" : "reset to pending"}.`);
    } else {
      showNotification(res.error || "Failed to update hotel status", "error");
    }
  };

  // 2. Save Commission Rate Handler
  const handleSaveCommissionRate = async (hotelId: string) => {
    const rateNum = parseFloat(editingRateValue);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      showNotification("Please enter a valid commission rate percentage (0 - 100%).", "error");
      return;
    }

    const res = await updateHotelCommissionRate(hotelId, rateNum);
    if (res.success) {
      setEditingCommissionId(null);
      refreshAdminData();
      showNotification(`Commission rate updated to ${rateNum}% for this hotel.`);
    } else {
      showNotification(res.error || "Failed to update commission rate", "error");
    }
  };

  // 3. User Role Update Handler
  const handleUpdateRole = async (userId: string, newRole: "guest" | "owner" | "admin") => {
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
      refreshAdminData();
      showNotification(`User role successfully changed to ${newRole.toUpperCase()}.`);
    } else {
      showNotification("Failed to update user role", "error");
    }
  };

  // 4. Hotel Owner Verification Approval Handler
  const handleUpdateOwnerApproval = async (userId: string, newStatus: OwnerApprovalStatus) => {
    const res = await updateOwnerApprovalStatus(userId, newStatus);
    if (res.success) {
      refreshAdminData();
      showNotification(
        newStatus === "approved"
          ? "Host application APPROVED! The hotel owner can now log in to the Owner Portal."
          : `Host application marked as ${newStatus.toUpperCase()}.`
      );
    } else {
      showNotification("Failed to update host approval status", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // CSV Export Utilities
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`Downloaded ${filename} successfully!`);
  };

  const handleExportBookingsCsv = () => {
    const headers = [
      "Booking ID",
      "Guest Name",
      "Guest Phone",
      "Hotel Name",
      "Area",
      "Check In",
      "Check Out",
      "Nights",
      "Guests",
      "Total Amount (INR)",
      "Advance Paid (INR)",
      "Balance Due (INR)",
      "Commission Rate (%)",
      "Commission Earned (INR)",
      "Status",
      "UTR Reference",
      "Created At"
    ];

    const rows = bookings.map((b) => [
      b.id,
      b.guestName,
      b.guestPhone,
      b.hotelName,
      b.area,
      b.checkIn,
      b.checkOut,
      b.nights,
      b.guests,
      b.totalAmount,
      b.advancePaid,
      b.balanceAmount,
      b.commissionRate,
      b.commissionEarned,
      b.status,
      b.utr || "N/A",
      b.createdAt
    ]);

    const dateStr = new Date().toISOString().split("T")[0];
    downloadCsv(`bhramo_bookings_master_${dateStr}.csv`, headers, rows);
  };

  const handleExportHotelsCsv = () => {
    const headers = [
      "Hotel ID",
      "Hotel Name",
      "Area",
      "Owner Name",
      "Owner Phone",
      "Status",
      "Commission Rate (%)",
      "Starting Price (INR)",
      "Rating",
      "Reviews Count"
    ];

    const rows = hotels.map((h) => [
      h.id,
      h.name,
      h.area,
      h.owner_name || "N/A",
      h.owner_phone || "N/A",
      h.status,
      h.commission_rate,
      h.starting_price,
      h.average_rating,
      h.review_count
    ]);

    const dateStr = new Date().toISOString().split("T")[0];
    downloadCsv(`bhramo_hotels_commission_ledger_${dateStr}.csv`, headers, rows);
  };

  // Filtered Hotels
  const filteredHotels = hotels.filter((h) => {
    if (hotelFilter !== "all" && h.status !== hotelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.area.toLowerCase().includes(q) ||
        (h.owner_name && h.owner_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter !== "all" && b.status !== bookingFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.hotelName.toLowerCase().includes(q) ||
        (b.utr && b.utr.includes(q))
      );
    }
    return true;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }
    return true;
  });

  // Pending Host Applications
  const pendingHosts = users.filter((u) => u.role === "owner" && u.approval_status === "pending");

  // Filtered Host Applications for Host Approvals Queue
  const filteredOwners = users.filter((u) => {
    if (u.role !== "owner") return false;
    if (hostApprovalFilter !== "all" && (u.approval_status || "approved") !== hostApprovalFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.hotel_name && u.hotel_name.toLowerCase().includes(q)) ||
        (u.hotel_area && u.hotel_area.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-konkan-sand-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5 text-konkan-teal-600" />
            <span>Platform Admin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            bhramo.com Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Approve hotel listings, audit bookings, manage platform commission rates & users
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-konkan-teal-300 bg-konkan-teal-50 text-konkan-teal-900 hover:bg-konkan-teal-100 font-bold text-xs transition-colors shadow-sm"
          >
            <CreditCard className="w-4 h-4 text-konkan-teal-700" />
            <span>UPI Verifications & Ledger &rarr;</span>
          </Link>

          <Link
            href="/hotels"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors"
          >
            <HotelIcon className="w-4 h-4" />
            <span>View Public Hotels</span>
          </Link>
        </div>
      </div>

      {/* Floating Notification */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border transition-all shadow-md flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-700 text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4 CORE STATS CARDS (Total Bookings, Revenue, Commission, Area Breakdown)  */}
      {/* ========================================================================= */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Bookings */}
          <div className="bg-white p-5 rounded-3xl border border-konkan-sand-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Bookings
              </span>
              <div className="w-9 h-9 rounded-2xl bg-konkan-teal-50 border border-konkan-teal-200 text-konkan-teal-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{stats.totalBookings}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="text-emerald-700 font-bold">{stats.confirmedBookingsCount} Confirmed/Settled</span>
                <span>·</span>
                <span className="text-slate-400">{stats.totalBookings - stats.confirmedBookingsCount} Other</span>
              </div>
            </div>
          </div>

          {/* 2. Total Gross Revenue */}
          <div className="bg-white p-5 rounded-3xl border border-konkan-sand-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gross Booking Value
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{formatINR(stats.totalGrossRevenue)}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total guest reservation volume across Dapoli & Harnai
              </p>
            </div>
          </div>

          {/* 3. Commission Earned */}
          <div className="bg-white p-5 rounded-3xl border border-konkan-sand-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Platform Commission Earned
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-800">{formatINR(stats.totalCommissionEarned)}</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Computed from per-hotel commission rates (avg ~14.8%)
              </p>
            </div>
          </div>

          {/* 4. Bookings Per Area (Dapoli vs Harnai) */}
          <div className="bg-white p-5 rounded-3xl border border-konkan-sand-200 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Bookings Per Area
              </span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Dapoli: {stats.areaBreakdown.dapoliCount} ({stats.areaBreakdown.dapoliPercentage}%)</span>
                <span>Harnai: {stats.areaBreakdown.harnaiCount} ({stats.areaBreakdown.harnaiPercentage}%)</span>
              </div>
              {/* Ratio Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-konkan-teal-600 h-full transition-all"
                  style={{ width: `${stats.areaBreakdown.dapoliPercentage}%` }}
                  title={`Dapoli: ${stats.areaBreakdown.dapoliCount} bookings`}
                />
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${stats.areaBreakdown.harnaiPercentage}%` }}
                  title={`Harnai: ${stats.areaBreakdown.harnaiCount} bookings`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>{formatINR(stats.areaBreakdown.dapoliRevenue)}</span>
                <span>{formatINR(stats.areaBreakdown.harnaiRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-konkan-sand-200 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("overview");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("hotels");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "hotels"
              ? "bg-konkan-teal-700 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hotel Listings Approval</span>
          {stats && stats.hotelStats.pending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 animate-pulse">
              {stats.hotelStats.pending} PENDING
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("host_approvals");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "host_approvals"
              ? "bg-amber-700 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Host Approvals</span>
          {pendingHosts.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 animate-pulse">
              {pendingHosts.length} PENDING
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {users.filter((u) => u.role === "owner").length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("bookings");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "bookings"
              ? "bg-konkan-teal-700 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>All Platform Bookings</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("users");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "users"
              ? "bg-purple-700 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory & Roles</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("reports");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "reports"
              ? "bg-emerald-800 text-white shadow-sm"
              : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Financial Reports & CSV</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & PLATFORM SUMMARY                                        */}
      {/* ========================================================================= */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          {/* Pending Host Applications Quick Approval Banner */}
          {pendingHosts.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <span>
                    {pendingHosts.length} New Hotel Owner Application{pendingHosts.length > 1 ? "s" : ""} Awaiting Admin Approval
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("host_approvals");
                    setHostApprovalFilter("pending");
                  }}
                  className="text-xs font-bold text-amber-900 underline hover:text-amber-950"
                >
                  View Approvals Queue &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingHosts.map((host) => (
                  <div
                    key={host.id}
                    className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">{host.name}</div>
                      <div className="text-[11px] text-amber-800 font-semibold truncate">
                        🏨 {host.hotel_name || "Konkan Coast Homestay"} ({host.hotel_area || "Dapoli"})
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {host.email} · {host.phone || "No phone"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateOwnerApproval(host.id, "approved")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateOwnerApproval(host.id, "rejected")}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Listings Quick Action Card */}
            <div className="bg-white p-6 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-konkan-teal-700" />
                  <h3 className="text-base font-bold text-slate-900">Hotel Listings Summary</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("hotels");
                    setHotelFilter("pending");
                  }}
                  className="text-xs text-konkan-teal-700 hover:underline font-bold"
                >
                  Manage Listings &rarr;
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="text-2xl font-black text-emerald-800">{stats.hotelStats.approved}</div>
                  <div className="text-[11px] font-bold text-emerald-700 uppercase mt-0.5">Approved Stays</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-2xl font-black text-amber-800">{stats.hotelStats.pending}</div>
                  <div className="text-[11px] font-bold text-amber-700 uppercase mt-0.5">Awaiting Review</div>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                  <div className="text-2xl font-black text-rose-800">{stats.hotelStats.rejected}</div>
                  <div className="text-[11px] font-bold text-rose-700 uppercase mt-0.5">Rejected</div>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Newly submitted hotels in Dapoli and Harnai require admin verification of amenities, host photo ID, and fire safety before appearing publicly on bhramo.com.
              </div>
            </div>

            {/* Platform Users Distribution Card */}
            <div className="bg-white p-6 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-700" />
                  <h3 className="text-base font-bold text-slate-900">Platform Registered Users</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="text-xs text-purple-700 hover:underline font-bold"
                >
                  Manage Users &rarr;
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-konkan-teal-50 rounded-2xl border border-konkan-teal-200">
                  <div className="text-2xl font-black text-konkan-teal-900">{stats.userStats.guests}</div>
                  <div className="text-[11px] font-bold text-konkan-teal-700 uppercase mt-0.5">Guests</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-2xl font-black text-amber-900">{stats.userStats.owners}</div>
                  <div className="text-[11px] font-bold text-amber-700 uppercase mt-0.5">Hotel Hosts</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <div className="text-2xl font-black text-purple-900">{stats.userStats.admins}</div>
                  <div className="text-[11px] font-bold text-purple-700 uppercase mt-0.5">Admins</div>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500">
                You can change user privileges between Guest, Hotel Host, and Platform Admin from the User Directory tab.
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Banner */}
          <div className="bg-gradient-to-r from-konkan-teal-800 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-konkan-teal-300 text-xs font-bold uppercase tracking-wider">
                <CreditCard className="w-4 h-4" />
                <span>Manual UPI Verification & Audit Ledger</span>
              </div>
              <h3 className="text-lg font-bold">Zero Payment Gateway Verification Desk</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Audit 12-digit UTR numbers submitted by guests, inspect payment screenshots, configure platform UPI IDs, and handle manual refunds.
              </p>
            </div>
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-konkan-sand-100 font-bold text-xs transition-colors shrink-0 self-start md:self-auto shadow-sm"
            >
              <span>Open Payment Verifications & Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HOTEL LISTINGS APPROVAL & COMMISSION RATE CONFIG                   */}
      {/* ========================================================================= */}
      {activeTab === "hotels" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-konkan-sand-100 rounded-2xl border border-konkan-sand-200 self-start">
              <button
                type="button"
                onClick={() => setHotelFilter("pending")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  hotelFilter === "pending"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Approval</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                  {hotels.filter((h) => h.status === "pending").length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHotelFilter("approved")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  hotelFilter === "approved"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                  {hotels.filter((h) => h.status === "approved").length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHotelFilter("rejected")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  hotelFilter === "rejected"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejected</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white">
                  {hotels.filter((h) => h.status === "rejected").length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHotelFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  hotelFilter === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>All ({hotels.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search hotel or host..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
              />
            </div>
          </div>

          {/* Hotel Listings List */}
          {filteredHotels.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-konkan-sand-200 shadow-sm space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">No Hotel Listings in this Filter</h4>
              <p className="text-xs text-slate-500">
                {hotelFilter === "pending"
                  ? "Great! All submitted hotel listings have been processed."
                  : "No hotels match the selected criteria."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHotels.map((hotel) => {
                const ownerWa = hotel.owner_phone ? hotel.owner_phone.replace(/\D/g, "") : "919422388200";
                const waLink = getWhatsAppLink(ownerWa, `Hi ${hotel.owner_name || "Host"}, this is bhramo.com admin regarding your hotel listing for ${hotel.name}.`);

                return (
                  <div
                    key={hotel.id}
                    className="bg-white rounded-3xl border border-konkan-sand-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-5"
                  >
                    {/* Hotel Image Thumbnail */}
                    <div className="relative w-full lg:w-64 h-48 lg:h-auto rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                      {hotel.images && hotel.images[0] ? (
                        <Image
                          src={hotel.images[0]}
                          alt={hotel.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 256px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {hotel.area}
                      </div>
                    </div>

                    {/* Listing Content */}
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        {/* Title & Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{hotel.name}</h3>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                hotel.status === "approved"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : hotel.status === "pending"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                              }`}
                            >
                              ● {hotel.status}
                            </span>
                          </div>

                          <div className="text-sm font-extrabold text-konkan-teal-900">
                            {formatINR(hotel.starting_price)} <span className="text-[11px] font-normal text-slate-400">/ night</span>
                          </div>
                        </div>

                        {/* Location & Host Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-konkan-sand-50/70 p-3 rounded-2xl border border-konkan-sand-200/60">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Property Host</span>
                            <span className="font-bold text-slate-800">{hotel.owner_name || "Registered Owner"}</span>
                            <span className="text-[11px] text-slate-500 block">{hotel.owner_phone || "Phone not provided"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Address</span>
                            <span className="font-medium text-slate-700">{hotel.address}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {hotel.description}
                        </p>

                        {/* Amenities Tags */}
                        {hotel.amenities && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {hotel.amenities.slice(0, 5).map((a, i) => (
                              <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                {a}
                              </span>
                            ))}
                            {hotel.amenities.length > 5 && (
                              <span className="text-[10px] text-slate-400 px-1 py-0.5">
                                +{hotel.amenities.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Commission Rate & Action Buttons */}
                      <div className="pt-3 border-t border-konkan-sand-200 flex flex-wrap items-center justify-between gap-3">
                        {/* Commission Rate Input */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                          <span className="text-[11px] font-bold text-slate-600 pl-1.5">
                            Commission Rate:
                          </span>
                          {editingCommissionId === hotel.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={editingRateValue}
                                onChange={(e) => setEditingRateValue(e.target.value)}
                                className="w-16 px-2 py-1 text-xs border border-konkan-teal-400 rounded-lg focus:outline-none"
                              />
                              <span className="text-xs font-bold text-slate-500">%</span>
                              <button
                                type="button"
                                onClick={() => handleSaveCommissionRate(hotel.id)}
                                className="px-2.5 py-1 rounded-lg bg-konkan-teal-700 text-white font-bold text-[11px] hover:bg-konkan-teal-800"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCommissionId(null)}
                                className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-konkan-teal-900 bg-konkan-teal-50 px-2 py-0.5 rounded-lg border border-konkan-teal-200">
                                {hotel.commission_rate ?? 15}%
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommissionId(hotel.id);
                                  setEditingRateValue((hotel.commission_rate ?? 15).toString());
                                }}
                                className="text-[11px] text-konkan-teal-700 hover:underline font-semibold"
                              >
                                Edit Rate
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Approval / Rejection Buttons */}
                        <div className="flex items-center gap-2 ml-auto">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors"
                            title="Chat with Host on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                          </a>

                          {hotel.status !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateHotelStatus(hotel.id, "approved")}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Listing</span>
                            </button>
                          )}

                          {hotel.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateHotelStatus(hotel.id, "rejected")}
                              className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Reject</span>
                            </button>
                          )}

                          {hotel.status === "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateHotelStatus(hotel.id, "pending")}
                              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
                            >
                              Reset to Pending
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALL PLATFORM BOOKINGS MASTER AUDIT                                 */}
      {/* ========================================================================= */}
      {activeTab === "bookings" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {["all", "confirmed", "pending_verification", "completed", "cancelled"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBookingFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    bookingFilter === st
                      ? "bg-konkan-teal-700 text-white shadow-sm"
                      : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportBookingsCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                title="Download complete bookings list as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search booking ID, guest, UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-3xl border border-konkan-sand-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-konkan-sand-100/70 border-b border-konkan-sand-200 text-slate-600 uppercase text-[10px] font-extrabold tracking-wider">
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Hotel / Area</th>
                    <th className="p-4">Guest</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-right">Advance Paid</th>
                    <th className="p-4 text-right">Comm. Earned</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-konkan-sand-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{b.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{b.hotelName}</div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{b.area}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{b.guestName}</div>
                        <div className="text-[11px] text-slate-400">{b.guestPhone}</div>
                      </td>
                      <td className="p-4">
                        <div>{b.checkIn} &rarr; {b.checkOut}</div>
                        <div className="text-[10px] text-slate-400">{b.nights}n · {b.guests} guests</div>
                      </td>
                      <td className="p-4 text-right font-black text-slate-900">
                        {formatINR(b.totalAmount)}
                      </td>
                      <td className="p-4 text-right font-bold text-konkan-teal-700">
                        {formatINR(b.advancePaid)}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-emerald-700">
                          {formatINR(b.commissionEarned)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">({b.commissionRate}%)</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            b.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "completed"
                              ? "bg-konkan-teal-100 text-konkan-teal-900"
                              : b.status === "pending_verification"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        {b.utr ? (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                            <span>{b.utr}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(b.utr!)}
                              title="Copy UTR"
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedUtr === b.utr ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: HOTEL OWNER APPROVALS QUEUE (Requirement: Admin verification of hosts) */}
      {/* ========================================================================= */}
      {activeTab === "host_approvals" && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="bg-white p-6 rounded-3xl border border-konkan-sand-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Host Onboarding Verification Queue</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Hotel Owner Applications
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify hotel ownership in Dapoli & Harnai before unlocking the Owner Portal & booking finances
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "pending", "approved", "rejected"] as const).map((status) => {
                const count =
                  status === "all"
                    ? users.filter((u) => u.role === "owner").length
                    : users.filter((u) => u.role === "owner" && (u.approval_status || "approved") === status).length;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setHostApprovalFilter(status)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                      hostApprovalFilter === status
                        ? "bg-amber-800 text-white shadow-sm"
                        : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
                    }`}
                  >
                    <span>{status === "all" ? "All Hosts" : status}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        hostApprovalFilter === status
                          ? "bg-amber-950 text-amber-100"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-3xl border border-konkan-sand-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-konkan-sand-50/70 border-b border-konkan-sand-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Owner / Applicant</th>
                    <th className="p-4">Registered Property</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4 text-center">Verification Status</th>
                    <th className="p-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOwners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No hotel owner applications matching filter &ldquo;{hostApprovalFilter}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredOwners.map((owner) => {
                      const isPending = owner.approval_status === "pending";
                      const isApproved = (owner.approval_status || "approved") === "approved";
                      const isRejected = owner.approval_status === "rejected";

                      return (
                        <tr key={owner.id} className="hover:bg-konkan-sand-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-sm">{owner.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {owner.id}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Applied: {new Date(owner.created_at).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>{owner.hotel_name || "Konkan Coast Homestay"}</span>
                            </div>
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                                <MapPin className="w-3 h-3 text-blue-600" />
                                {owner.hotel_area || "Dapoli Belt"}
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-medium text-slate-800">{owner.email}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{owner.phone || "No phone registered"}</div>
                            {owner.phone && (
                              <a
                                href={`https://wa.me/${owner.phone.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(
                                  owner.name
                                )}%2C%20this%20is%20Bhramo%20Admin.%20We%20received%20your%20hotel%20owner%20registration%20for%20${encodeURIComponent(
                                  owner.hotel_name || "your property"
                                )}.%20Please%20share%20your%20electricity%20bill%20or%20trade%20license%20for%20verification.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 mt-1"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>Verify on WhatsApp</span>
                              </a>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Approved Host</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
                                <XCircle className="w-3 h-3 text-rose-700" />
                                <span>Declined</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOwnerApproval(owner.id, "approved")}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve as Hotel Owner</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOwnerApproval(owner.id, "rejected")}
                                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center gap-1"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOwnerApproval(owner.id, "rejected")}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs border border-slate-200 transition-colors"
                                >
                                  Suspend Access
                                </button>
                              )}

                              {isRejected && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOwnerApproval(owner.id, "approved")}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-colors"
                                >
                                  Re-Approve Host
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Policy Explainer */}
          <div className="p-5 rounded-3xl bg-konkan-sand-50 border border-konkan-sand-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-konkan-teal-700" />
              <span>Owner Access Control Protocol</span>
            </div>
            <p className="leading-relaxed">
              <strong>Security Rule:</strong> Unauthenticated visitors and unapproved applicants cannot view the Owner Dashboard (`/owner/dashboard`) or access booking reservations and guest details. Only after the administrator clicks &ldquo;Approve as Hotel Owner&rdquo; can the host log in and manage their property.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: USER MANAGEMENT & ROLE SWITCHER                                    */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-konkan-sand-100 rounded-2xl border border-konkan-sand-200">
              {["all", "guest", "owner", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    userRoleFilter === r
                      ? "bg-purple-700 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r === "all" ? "All Users" : `${r}s`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-konkan-sand-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-konkan-sand-100/70 border-b border-konkan-sand-200 text-slate-600 uppercase text-[10px] font-extrabold tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Activity</th>
                    <th className="p-4">Current Role</th>
                    <th className="p-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-konkan-sand-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{u.email}</div>
                        <div className="text-[11px] text-slate-400">{u.phone || "No phone registered"}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-700 font-medium">
                          {u.role === "owner"
                            ? `${u.hotelsCount} Hotels Listed`
                            : `${u.bookingsCount} Reservations`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-900 border border-purple-200"
                              : u.role === "owner"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-konkan-teal-100 text-konkan-teal-900 border border-konkan-teal-200"
                          }`}
                        >
                          ● {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleUpdateRole(u.id, e.target.value as "guest" | "owner" | "admin")
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
                        >
                          <option value="guest">Set as Guest</option>
                          <option value="owner">Set as Owner</option>
                          <option value="admin">Set as Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FINANCIAL REPORTS & CSV EXPORT                                     */}
      {/* ========================================================================= */}
      {activeTab === "reports" && stats && (
        <div className="space-y-6">
          {/* Export Action Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-konkan-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-emerald-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Financial Reconciliation & Audit</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Platform Earnings & Host Settlement Ledger
              </h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Download structured CSV reports for accounting, host payouts, and platform tax compliance. Covers all completed, confirmed, and pending UPI transactions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportBookingsCsv}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Bookings CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportHotelsCsv}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Hotels CSV</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>

          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Gross Merchandise Value (GMV)
              </span>
              <div className="text-2xl font-black text-slate-900">{formatINR(stats.totalGrossRevenue)}</div>
              <span className="text-[11px] text-slate-500 block">Across {stats.totalBookings} guest reservations</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Platform Commission Retained
              </span>
              <div className="text-2xl font-black text-emerald-800">{formatINR(stats.totalCommissionEarned)}</div>
              <span className="text-[11px] text-emerald-600 block">Calculated via per-hotel commission rates</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Host Balance Collectible at Check-in
              </span>
              <div className="text-2xl font-black text-amber-900">
                {formatINR(Math.max(0, stats.totalGrossRevenue - stats.totalCommissionEarned))}
              </div>
              <span className="text-[11px] text-amber-700 block">Paid directly to homestay hosts</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Average Effective Commission
              </span>
              <div className="text-2xl font-black text-purple-900">
                {stats.totalGrossRevenue > 0
                  ? ((stats.totalCommissionEarned / stats.totalGrossRevenue) * 100).toFixed(1)
                  : "15.0"}%
              </div>
              <span className="text-[11px] text-purple-600 block">Dapoli (15%) · Harnai (14%) average</span>
            </div>
          </div>

          {/* Area Revenue Reconciliation Table */}
          <div className="bg-white rounded-3xl border border-konkan-sand-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-konkan-sand-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Destination Performance & Revenue Distribution</h3>
                <p className="text-xs text-slate-500">Breakdown between Dapoli and Harnai coastal hubs</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-konkan-sand-50/70 border-b border-konkan-sand-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="p-4">Destination Area</th>
                    <th className="p-4 text-center">Total Bookings</th>
                    <th className="p-4 text-center">Share of Volume</th>
                    <th className="p-4 text-right">Gross GMV</th>
                    <th className="p-4 text-right">Estimated Commission</th>
                    <th className="p-4 text-right">Avg Booking Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-konkan-sand-100 font-medium text-slate-800">
                  <tr className="hover:bg-konkan-sand-50/50 transition-colors">
                    <td className="p-4 font-bold text-konkan-teal-950 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-konkan-teal-700" />
                      <span>Dapoli Coastal Belt</span>
                    </td>
                    <td className="p-4 text-center font-bold">{stats.areaBreakdown.dapoliCount}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-konkan-teal-100 text-konkan-teal-900">
                        {stats.areaBreakdown.dapoliPercentage}%
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(stats.areaBreakdown.dapoliRevenue)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-700">
                      {formatINR(Math.round(stats.areaBreakdown.dapoliRevenue * 0.15))}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">
                      {stats.areaBreakdown.dapoliCount > 0
                        ? formatINR(Math.round(stats.areaBreakdown.dapoliRevenue / stats.areaBreakdown.dapoliCount))
                        : "₹0"}
                    </td>
                  </tr>

                  <tr className="hover:bg-konkan-sand-50/50 transition-colors">
                    <td className="p-4 font-bold text-blue-950 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>Harnai & Suvarnadurg Port</span>
                    </td>
                    <td className="p-4 text-center font-bold">{stats.areaBreakdown.harnaiCount}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                        {stats.areaBreakdown.harnaiPercentage}%
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(stats.areaBreakdown.harnaiRevenue)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-700">
                      {formatINR(Math.round(stats.areaBreakdown.harnaiRevenue * 0.14))}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">
                      {stats.areaBreakdown.harnaiCount > 0
                        ? formatINR(Math.round(stats.areaBreakdown.harnaiRevenue / stats.areaBreakdown.harnaiCount))
                        : "₹0"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature 9: Host Commission Settlement & Payout Slips */}
          {(() => {
            const currentSelectedHotel = hotels.find(
              (h) => h.id === (selectedSettlementHotelId || hotels[0]?.id)
            ) || hotels[0];

            if (!currentSelectedHotel) return null;

            const hotelBookings = bookings.filter(
              (b) => b.hotelId === currentSelectedHotel.id && b.status !== "cancelled"
            );
            const hotelGross = hotelBookings.reduce((sum, b) => sum + b.totalAmount, 0);
            const hotelAdvance = hotelBookings.reduce((sum, b) => sum + b.advancePaid, 0);
            const hotelHostCollected = hotelBookings.reduce((sum, b) => sum + b.balanceAmount, 0);
            const hotelCommission = Math.round(hotelGross * ((currentSelectedHotel.commission_rate || 15) / 100));

            const hostSettlementWaLink = getWhatsAppLink(
              currentSelectedHotel.owner_phone || "919422388200",
              `*🏨 Official Host Settlement Statement — bhramo.com*
--------------------------------
*Property:* ${currentSelectedHotel.name} (${currentSelectedHotel.area})
*Host:* ${currentSelectedHotel.owner_name || "Host"}
*Completed Guest Bookings:* ${hotelBookings.length}
--------------------------------
*Gross Bookings (GMV):* ₹${hotelGross}
*15% Platform Advance Retained:* ₹${hotelAdvance}
*85% Cash Collected Directly by Host:* ₹${hotelHostCollected}
*Platform Commission (${currentSelectedHotel.commission_rate}%):* ₹${hotelCommission}
*Net Settlement Variance:* ₹0 (Fully Reconciled)
--------------------------------
Generated from bhramo.com Admin Finance Portal`
            );

            return (
              <div className="bg-white rounded-3xl border border-konkan-sand-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-konkan-sand-200 pb-5">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Host Settlement Reconciliation</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      Host Commission Settlement & Payout Slip Generator
                    </h3>
                    <p className="text-xs text-slate-500">
                      Audit individual property performance, cash balances collected by hosts, and commission statements.
                    </p>
                  </div>

                  {/* Property Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 shrink-0">Select Property:</span>
                    <select
                      value={selectedSettlementHotelId || currentSelectedHotel.id}
                      onChange={(e) => setSelectedSettlementHotelId(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-konkan-teal-700"
                    >
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.area})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Printable Slip Card */}
                <div className="p-6 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-konkan-sand-200 pb-4">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{currentSelectedHotel.name}</h4>
                      <span className="text-xs text-slate-500">
                        Host: <strong>{currentSelectedHotel.owner_name || "Host"}</strong> · Phone: {currentSelectedHotel.owner_phone || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={hostSettlementWaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send Slip via WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Slip</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-konkan-sand-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Reservations</span>
                      <strong className="text-sm font-black text-slate-900">{hotelBookings.length}</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-konkan-sand-200">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Merchandise Value</span>
                      <strong className="text-sm font-black text-slate-900">{formatINR(hotelGross)}</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-konkan-sand-200">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase block">Platform Fee Retained</span>
                      <strong className="text-sm font-black text-emerald-700">{formatINR(hotelAdvance)}</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-konkan-sand-200">
                      <span className="text-[10px] text-amber-600 font-bold uppercase block">Cash Collected by Host</span>
                      <strong className="text-sm font-black text-amber-900">{formatINR(hotelHostCollected)}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Agreed Commission Rate: <strong>{currentSelectedHotel.commission_rate}%</strong> · Platform Share: <strong>{formatINR(hotelCommission)}</strong>
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      ● Status: Fully Reconciled
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
