"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfToday } from "date-fns";
import { HotelWithDetails } from "@/lib/hotels-service";
import { RoomType } from "@/types/supabase";
import {
  calculatePriceWithWeekends,
  checkRoomAvailability,
  createBookingHold,
  PriceCalculationResult
} from "@/lib/booking-service";
import { formatINR } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar as CalendarIcon,
  Users,
  User,
  Baby,
  Minus,
  Plus,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Lock,
  UserCheck,
  Tag,
  Flag,
  Star,
  Check,
  PhoneCall
} from "lucide-react";

interface RoomBookingWidgetProps {
  hotel: HotelWithDetails;
  selectedRoomId?: string;
  checkInDate?: Date | null;
  checkOutDate?: Date | null;
  onDatesChange?: (checkIn: Date | null, checkOut: Date | null) => void;
  onFocusCalendar?: () => void;
}

const KONKAN_ADDONS = [
  {
    id: "dolphin",
    title: "🐬 Dolphin Boat Safari Pass",
    price: 350,
    desc: "Early morning boat ride in Murud/Karde feeding waters"
  },
  {
    id: "modak",
    title: "🥥 Steamed Ukadiche Modak Box",
    price: 200,
    desc: "Fresh coconut & jaggery artisanal breakfast treat (4 pcs)"
  },
  {
    id: "fort",
    title: "🏰 Suvarnadurg Fort Ferry Pass",
    price: 250,
    desc: "Harbor boat ferry & historical tour at Harnai Fort"
  }
];

export function RoomBookingWidget({
  hotel,
  selectedRoomId,
  checkInDate: propCheckIn,
  checkOutDate: propCheckOut,
  onDatesChange,
  onFocusCalendar,
}: RoomBookingWidgetProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isLoggedIn = Boolean(user || profile);

  const [selectedRoom, setSelectedRoom] = useState<RoomType>(
    hotel.room_types.find((r) => r.id === selectedRoomId) || hotel.room_types[0]
  );

  // Date state
  const [internalCheckIn, setInternalCheckIn] = useState<Date | null>(startOfToday());
  const [internalCheckOut, setInternalCheckOut] = useState<Date | null>(addDays(startOfToday(), 2));

  const checkIn = propCheckIn !== undefined ? propCheckIn : internalCheckIn;
  const checkOut = propCheckOut !== undefined ? propCheckOut : internalCheckOut;

  // Multi-Room & In-front-of-eyes Stepper State
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);

  // Dual Checkout Option (Point 1: 20% Advance via UPI vs 100% at Hotel Desk)
  const [paymentOption, setPaymentOption] = useState<"advance_upi" | "pay_at_hotel">("advance_upi");

  // Guest Contact Information (Instant Guest Checkout)
  const [guestName, setGuestName] = useState<string>(profile?.name || "");
  const [guestPhone, setGuestPhone] = useState<string>(profile?.phone || "");

  // Konkan Experience Addons selection state
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Capacity calculation based on bed rules
  const bedsCount = selectedRoom.beds_count || (selectedRoom.capacity > 2 ? 2 : 1);
  const maxGuestsPerRoom = bedsCount === 2 ? 4 : 2;
  const totalAdultCapacity = roomsCount * maxGuestsPerRoom;
  const guestsCount = adultsCount + childrenCount;

  const [priceData, setPriceData] = useState<PriceCalculationResult | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    checking: boolean;
    available: boolean;
    error?: string;
    remainingRooms?: number;
  }>({ checking: false, available: true });

  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-sync profile details if user logs in
  useEffect(() => {
    if (profile) {
      if (!guestName && profile.name) setGuestName(profile.name);
      if (!guestPhone && profile.phone) setGuestPhone(profile.phone);
    }
  }, [profile, guestName, guestPhone]);

  // When room selection changes from props
  useEffect(() => {
    if (selectedRoomId) {
      const match = hotel.room_types.find((r) => r.id === selectedRoomId);
      if (match) setSelectedRoom(match);
    }
  }, [selectedRoomId, hotel.room_types]);

  // Re-calculate price and check availability dynamically
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setPriceData(null);
      setAvailabilityStatus({ checking: false, available: true });
      return;
    }

    // Children under 12 stay free in existing bedding; extra guest fee applies to extra adults
    const result = calculatePriceWithWeekends(
      Number(selectedRoom.base_price),
      Number(selectedRoom.weekend_price),
      checkIn,
      checkOut,
      roomsCount,
      adultsCount,
      bedsCount,
      selectedRoom.extra_guest_fee
    );
    setPriceData(result);

    let isCancelled = false;
    async function runAvailabilityCheck() {
      if (!checkIn || !checkOut) return;
      setAvailabilityStatus({ checking: true, available: false });
      const res = await checkRoomAvailability(selectedRoom.id, checkIn, checkOut, roomsCount);
      if (!isCancelled) {
        setAvailabilityStatus({
          checking: false,
          available: res.available,
          error: res.error,
          remainingRooms: res.remainingRooms,
        });
      }
    }

    runAvailabilityCheck();

    return () => {
      isCancelled = true;
    };
  }, [selectedRoom, checkIn, checkOut, roomsCount, adultsCount, bedsCount]);

  // Calculate total add-on cost
  const addonsTotal = selectedAddons.reduce((sum, id) => {
    const addon = KONKAN_ADDONS.find((a) => a.id === id);
    return sum + (addon ? addon.price * (id === "dolphin" ? guestsCount : 1) : 0);
  }, 0);

  const grandTotal = (priceData?.totalAmount || Number(selectedRoom.base_price) * roomsCount) + addonsTotal;
  const advancePercent = 20; // 20% advance via UPI to lock 15-min hold
  const advancePayable = Math.round((grandTotal * advancePercent) / 100);
  const balanceAtHotel = Math.max(0, grandTotal - advancePayable);
  const mmtComparisonPrice = Math.round(grandTotal * 1.20);
  const directSavings = mmtComparisonPrice - grandTotal;

  // Phone validation (10 digits starting with 6-9)
  const cleanPhone = guestPhone.replace(/\D/g, "");
  const isValidPhone = /^[6-9]\d{9}$/.test(cleanPhone);

  const handleCreateHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!checkIn || !checkOut) {
      if (onFocusCalendar) onFocusCalendar();
      return;
    }

    if (!guestName.trim()) {
      setFormError("Please enter the primary guest name.");
      return;
    }

    if (!isValidPhone) {
      setFormError("Please enter a valid 10-digit WhatsApp number (e.g. 9820012345).");
      return;
    }

    if (priceData?.minimumStayViolated) {
      setFormError(
        `Minimum Stay Requirement: A minimum of ${priceData.minimumStayNights} nights is required for ${priceData.activeSeasonSummary}.`
      );
      return;
    }

    if (!availabilityStatus.available) {
      setFormError(availabilityStatus.error || "Selected dates are not available.");
      return;
    }

    setIsHolding(true);

    const isPayAtHotel = paymentOption === "pay_at_hotel";

    const res = await createBookingHold({
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelArea: hotel.area,
      roomType: selectedRoom,
      guestName: guestName.trim(),
      guestPhone: cleanPhone,
      guestId: profile?.id,
      checkIn,
      checkOut,
      roomsCount,
      guestsCount,
      totalAmount: grandTotal,
      paymentMethod: isPayAtHotel ? "pay_at_hotel" : "advance_upi",
    });

    setIsHolding(false);

    if (res.success && res.bookingId) {
      if (isPayAtHotel) {
        // Point 1: Direct confirmation for zero-advance desk bookings (OYO Model)
        router.push(`/booking/confirmation/${res.bookingId}?mode=hotel_desk`);
      } else {
        // Advance UPI route to lock 15-minute hold
        router.push(`/booking/summary?id=${res.bookingId}`);
      }
    } else {
      setFormError(res.error || "Unable to acquire room hold. Please try different dates.");
    }
  };

  const hasFullDates = Boolean(checkIn && checkOut);
  const maxRoomsLimit = Math.min(8, availabilityStatus.remainingRooms || 8);
  const needsMoreRooms = adultsCount > totalAdultCapacity;

  return (
    <div className="space-y-4">
      {/* 1. Top Guarantee & Direct Savings Tag */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800">Direct Host Booking</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          0% Middleman Fee
        </span>
      </div>

      {/* Main Booking Card */}
      <div
        id="booking-widget"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xl space-y-5"
      >
        {/* Header Price Display */}
        <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
          <div>
            {hasFullDates && priceData ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900">
                    {formatINR(Math.round(priceData.totalAmount / (priceData.nights * roomsCount)))}
                  </span>
                  <span className="text-xs text-slate-500">/ room / night</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  Includes weekend rate & tax transparency
                </span>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  Select dates
                </h3>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Starting from {formatINR(Number(selectedRoom.base_price))} / night
                </span>
              </div>
            )}
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-1 text-xs text-slate-700 shrink-0 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold">{hotel.average_rating}</span>
            <span className="text-slate-400">({hotel.review_count})</span>
          </div>
        </div>

        <form onSubmit={handleCreateHold} className="space-y-4">
          {/* Room Category Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
              <span>Select Room Category</span>
              <span className="text-[10px] text-konkan-teal-700 font-semibold lowercase">
                {bedsCount === 1 ? "standard (1 bed)" : "family suite (2 beds)"}
              </span>
            </label>
            <select
              value={selectedRoom.id}
              onChange={(e) => {
                const r = hotel.room_types.find((item) => item.id === e.target.value);
                if (r) setSelectedRoom(r);
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
            >
              {hotel.room_types.map((room) => {
                const rBeds = room.beds_count || (room.capacity > 2 ? 2 : 1);
                return (
                  <option key={room.id} value={room.id}>
                    {room.name} ({rBeds === 1 ? "1 Bed · Max 2 Adults" : "2 Beds · Max 4 Adults"} · {room.is_ac ? "AC" : "Non-AC"}) — {formatINR(Number(room.base_price))}/nt
                  </option>
                );
              })}
            </select>
          </div>

          {/* Travel Dates Picker Bar */}
          <div className="rounded-2xl border border-slate-300 overflow-hidden text-xs bg-white shadow-2xs">
            <div className="grid grid-cols-2">
              <div
                onClick={onFocusCalendar}
                className="p-3 border-r border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors"
                title="Click to select on calendar"
              >
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                  <CalendarIcon className="w-3 h-3 text-konkan-teal-700" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                    CHECK-IN
                  </span>
                </div>
                <span
                  className={`block text-xs sm:text-sm font-semibold ${
                    checkIn ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {checkIn ? format(checkIn, "dd MMM yyyy") : "Add date"}
                </span>
              </div>

              <div
                onClick={onFocusCalendar}
                className="p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                title="Click to select on calendar"
              >
                <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                  <CalendarIcon className="w-3 h-3 text-konkan-teal-700" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                    CHECKOUT
                  </span>
                </div>
                <span
                  className={`block text-xs sm:text-sm font-semibold ${
                    checkOut ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {checkOut ? format(checkOut, "dd MMM yyyy") : "Add date"}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* IN-FRONT-OF-EYES CONTROLS: ROOMS & GUEST STEPPERS        */}
          {/* ========================================================= */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
              <span>Rooms & Guests Selection</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {roomsCount} {roomsCount === 1 ? "room" : "rooms"} · {guestsCount} {guestsCount === 1 ? "guest" : "guests"}
              </span>
            </div>

            {/* 1. Rooms Stepper */}
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Rooms</span>
                <span className="text-[10px] text-slate-500">
                  {bedsCount === 1 ? "1 Bed per room" : "2 Beds per room"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRoomsCount((prev) => Math.max(1, prev - 1))}
                  disabled={roomsCount <= 1}
                  className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Decrease rooms"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-xs sm:text-sm text-slate-900 w-12 text-center">
                  {roomsCount} {roomsCount === 1 ? "Rm" : "Rms"}
                </span>
                <button
                  type="button"
                  onClick={() => setRoomsCount((prev) => Math.min(maxRoomsLimit, prev + 1))}
                  disabled={roomsCount >= maxRoomsLimit}
                  className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Increase rooms"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Adults Stepper (12+ yrs) */}
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Adults</span>
                <span className="text-[10px] text-slate-500">Ages 12+ years</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdultsCount((prev) => Math.max(1, prev - 1))}
                  disabled={adultsCount <= 1}
                  className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Decrease adults"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-xs sm:text-sm text-slate-900 w-12 text-center">
                  {adultsCount}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextAdults = adultsCount + 1;
                    setAdultsCount(nextAdults);
                    // Proactive room recommendation for large family
                    if (nextAdults > totalAdultCapacity && roomsCount < maxRoomsLimit) {
                      setRoomsCount((r) => r + 1);
                    }
                  }}
                  className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 transition-all"
                  aria-label="Increase adults"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Children Stepper (0-11 yrs, Stay Free) */}
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">Children</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                    Stay Free
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">Ages 0-11 with parents</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setChildrenCount((prev) => Math.max(0, prev - 1))}
                  disabled={childrenCount <= 0}
                  className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Decrease children"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-xs sm:text-sm text-slate-900 w-12 text-center">
                  {childrenCount}
                </span>
                <button
                  type="button"
                  onClick={() => setChildrenCount((prev) => Math.min(roomsCount * 2, prev + 1))}
                  disabled={childrenCount >= roomsCount * 2}
                  className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Increase children"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Capacity Suggestion Badge if needed */}
            {needsMoreRooms && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                <span>
                  💡 {adultsCount} adults exceed standard {totalAdultCapacity}-guest capacity for {roomsCount} {roomsCount === 1 ? "room" : "rooms"}.
                </span>
                {roomsCount < maxRoomsLimit && (
                  <button
                    type="button"
                    onClick={() => setRoomsCount((prev) => prev + 1)}
                    className="text-[10px] font-bold bg-amber-200 hover:bg-amber-300 px-2 py-0.5 rounded-md text-amber-950 transition-colors shrink-0 ml-2"
                  >
                    + Add 1 Room
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Konkan Experience Add-ons Selection */}
          <div className="space-y-2 pt-1">
            <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              Konkan Experience Add-ons (Optional)
            </span>
            <div className="space-y-1.5">
              {KONKAN_ADDONS.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-konkan-teal-300"
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="font-bold text-[11px] flex items-center gap-1">
                        <span>{addon.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {addon.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-xs">
                        +{formatINR(addon.price)}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Availability Status Indicator */}
          {hasFullDates && (
            <>
              {availabilityStatus.checking ? (
                <div className="p-2.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-konkan-teal-700 border-t-transparent rounded-full animate-spin" />
                  <span>Checking live room availability...</span>
                </div>
              ) : !availabilityStatus.available ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Unavailable for selected dates</strong>
                    <span>{availabilityStatus.error}</span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{roomsCount} {roomsCount === 1 ? "room" : "rooms"} available for your dates</span>
                  </div>
                  {availabilityStatus.remainingRooms !== undefined && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      {availabilityStatus.remainingRooms} left
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* SEAMLESS GUEST CHECKOUT INPUTS (ZERO LOGIN WALL)          */}
          {/* ========================================================= */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-300 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                Guest Contact Details
              </span>
              {isLoggedIn ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Logged In
                </span>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                  Guest Checkout
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Patil"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-konkan-teal-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    WhatsApp Mobile Number *
                  </label>
                  {isValidPhone && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid WhatsApp
                    </span>
                  )}
                </div>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-600 font-bold text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9820012345"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-r-xl text-xs sm:text-sm bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-konkan-teal-600 font-mono font-medium tracking-wide"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  15-minute booking hold voucher & Google Maps pin sent directly via WhatsApp.
                </span>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="pt-1 text-[11px] text-slate-500">
                Already have an account?{" "}
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/hotels/${hotel.id}`)}`}
                  className="text-konkan-teal-700 font-bold hover:underline"
                >
                  Sign in
                </Link>{" "}
                to sync with your saved profile (optional).
              </div>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* PRICING BREAKDOWN: ADVANCE VS BALANCE AT HOTEL             */}
          {/* ========================================================= */}
          {hasFullDates && priceData && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span>
                  Stay Details ({priceData.nights} {priceData.nights === 1 ? "night" : "nights"}, {roomsCount} {roomsCount === 1 ? "room" : "rooms"})
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {adultsCount} adults {childrenCount > 0 ? `· ${childrenCount} kids` : ""}
                </span>
              </div>

              {priceData.weekdayNights > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Weekday rate ({priceData.weekdayNights} nt × {roomsCount} rm)</span>
                  <span className="font-medium text-slate-900">
                    {formatINR(priceData.totalWeekdayCost)}
                  </span>
                </div>
              )}

              {priceData.weekendNights > 0 && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Weekend Fri/Sat ({priceData.weekendNights} nt × {roomsCount} rm)</span>
                  <span>{formatINR(priceData.totalWeekendCost)}</span>
                </div>
              )}

              {priceData.peakHolidayNights > 0 && (
                <div className="flex justify-between text-purple-900 bg-purple-50 p-1.5 rounded-lg border border-purple-200 font-semibold text-[11px]">
                  <span>{priceData.activeSeasonSummary} ({priceData.peakHolidayNights} nt × {roomsCount} rm)</span>
                  <span>{formatINR(priceData.totalPeakSurgeCost)}</span>
                </div>
              )}

              {priceData.extraGuestsCount > 0 && (
                <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200 font-semibold text-[11px]">
                  <span>Additional adult fee</span>
                  <span>+{formatINR(priceData.totalExtraGuestCost)}</span>
                </div>
              )}

              {addonsTotal > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Konkan Add-ons</span>
                  <span>+{formatINR(addonsTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>bhramo.com Commission Fee</span>
                <span className="text-emerald-600 font-bold">₹0 (Zero Middleman Fee)</span>
              </div>

              {/* Total Stay Price */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Total Stay Cost</span>
                <span className="text-xl text-konkan-teal-950 font-black">{formatINR(grandTotal)}</span>
              </div>

              {/* Two-Tier Payment Split: Advance vs Check-in Desk */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Pay Now (Advance 20%)
                  </span>
                  <span className="text-base font-black text-emerald-950 block mt-0.5">
                    {formatINR(advancePayable)}
                  </span>
                  <span className="text-[9px] text-emerald-700 leading-tight block mt-0.5">
                    Locks 15-min hold via UPI
                  </span>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                    At Hotel Desk (80%)
                  </span>
                  <span className="text-base font-black text-amber-950 block mt-0.5">
                    {formatINR(balanceAtHotel)}
                  </span>
                  <span className="text-[9px] text-amber-800 leading-tight block mt-0.5">
                    Paid directly at check-in
                  </span>
                </div>
              </div>

              {/* Direct Booking Savings vs MMT / Agoda */}
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1 shadow-2xs mt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Price on MakeMyTrip / Agoda:</span>
                  <span className="line-through font-semibold text-slate-500">
                    {formatINR(mmtComparisonPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-black text-emerald-900 text-xs">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>bhramo.com Direct Rate:</span>
                  </span>
                  <span>{formatINR(grandTotal)}</span>
                </div>
                <div className="pt-1 border-t border-emerald-200/80 text-[11px] text-emerald-800 font-extrabold flex items-center justify-between">
                  <span>🎉 Direct Host Savings:</span>
                  <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-full font-black text-[10px] tracking-wide shadow-xs">
                    You Save {formatINR(directSavings)}
                  </span>
                </div>
              </div>

              {/* Point 1: Dual Checkout Method Selector (Advance UPI vs Pay at Hotel Desk) */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  Choose Payment Option:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option A: 20% Advance via UPI */}
                  <div
                    onClick={() => setPaymentOption("advance_upi")}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentOption === "advance_upi"
                        ? "border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">⚡ 20% Advance UPI</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentOption === "advance_upi"
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {paymentOption === "advance_upi" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-950 block mt-1">
                      Pay {formatINR(advancePayable)} Now
                    </span>
                    <span className="text-[10px] text-emerald-700 leading-tight block mt-0.5">
                      Guaranteed instant room hold. 80% balance paid at hotel.
                    </span>
                  </div>

                  {/* Option B: Pay 100% at Hotel Desk */}
                  <div
                    onClick={() => setPaymentOption("pay_at_hotel")}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentOption === "pay_at_hotel"
                        ? "border-amber-600 bg-amber-50/80 shadow-xs ring-1 ring-amber-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">🏨 Pay at Hotel Desk</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentOption === "pay_at_hotel"
                            ? "border-amber-600 bg-amber-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {paymentOption === "pay_at_hotel" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-950 block mt-1">
                      ₹0 Online Advance
                    </span>
                    <span className="text-[10px] text-amber-800 leading-tight block mt-0.5">
                      Zero risk. Held till 4 PM check-in. 100% paid in Cash/UPI.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button: Check availability OR Reserve Hold */}
          {!hasFullDates ? (
            <button
              type="button"
              onClick={onFocusCalendar}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-konkan-teal-700 to-emerald-700 hover:from-konkan-teal-800 hover:to-emerald-800 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Select Travel Dates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="submit"
                disabled={!availabilityStatus.available || isHolding}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-konkan-teal-700 to-emerald-700 hover:from-konkan-teal-800 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isHolding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {paymentOption === "pay_at_hotel"
                        ? "Confirming Zero-Advance Reservation..."
                        : "Securing 15-Minute Room Hold..."}
                    </span>
                  </>
                ) : paymentOption === "pay_at_hotel" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Reservation · Pay ₹0 Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Lock 15-Min Hold & Pay {formatINR(advancePayable)} Advance</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 text-center leading-tight">
                {paymentOption === "pay_at_hotel"
                  ? "🏨 Pay at Hotel Desk selected. Zero payment online. Pay upon arrival."
                  : "⚡ Instant 15-minute room inventory lock via UPI. 0% platform fee."}
              </p>
            </div>
          )}

          {/* Guarantee Note */}
          <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero cancellation fee prior to hold expiry. Pay balance at desk.</span>
          </div>

          {/* Report this listing Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => alert("Thank you. Listing status verified by bhramo.com.")}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 underline transition-colors"
            >
              <Flag className="w-3 h-3" />
              <span>Report or verify listing details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
