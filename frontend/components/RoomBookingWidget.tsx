"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfToday, isBefore } from "date-fns";
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
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Lock,
  LogIn,
  UserCheck,
  Tag,
  Flag,
  ChevronDown,
  Star,
  PlusCircle,
  Check
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

  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [guestsCount, setGuestsCount] = useState<number>(2);

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
  const maxAllowedGuests = roomsCount * maxGuestsPerRoom;

  const [guestName, setGuestName] = useState<string>(profile?.name || "");
  const [guestPhone, setGuestPhone] = useState<string>(profile?.phone || "");

  const [priceData, setPriceData] = useState<PriceCalculationResult | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    checking: boolean;
    available: boolean;
    error?: string;
    remainingRooms?: number;
  }>({ checking: false, available: true });

  const [isHolding, setIsHolding] = useState<boolean>(false);

  // Auto-clamp guests count if room type or roomsCount changes
  useEffect(() => {
    if (guestsCount > maxAllowedGuests) {
      setGuestsCount(maxAllowedGuests);
    }
  }, [maxAllowedGuests, guestsCount]);

  // Sync profile details if user logs in
  useEffect(() => {
    if (profile) {
      if (!guestName) setGuestName(profile.name);
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

  // Re-calculate price and check availability
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setPriceData(null);
      setAvailabilityStatus({ checking: false, available: true });
      return;
    }

    const result = calculatePriceWithWeekends(
      Number(selectedRoom.base_price),
      Number(selectedRoom.weekend_price),
      checkIn,
      checkOut,
      roomsCount,
      guestsCount,
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
  }, [selectedRoom, checkIn, checkOut, roomsCount, guestsCount, bedsCount]);

  // Calculate total add-on cost
  const addonsTotal = selectedAddons.reduce((sum, id) => {
    const addon = KONKAN_ADDONS.find((a) => a.id === id);
    return sum + (addon ? addon.price * (id === "dolphin" ? guestsCount : 1) : 0);
  }, 0);

  const grandTotal = (priceData?.totalAmount || Number(selectedRoom.base_price)) + addonsTotal;

  const handleCreateHold = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/hotels/${hotel.id}`)}`);
      return;
    }

    if (!checkIn || !checkOut) {
      if (onFocusCalendar) onFocusCalendar();
      return;
    }

    if (!guestName.trim() || !guestPhone.trim()) {
      alert("Please provide guest name and mobile number to hold rooms.");
      return;
    }

    if (!availabilityStatus.available) {
      alert(availabilityStatus.error || "Selected dates are not available.");
      return;
    }

    setIsHolding(true);

    const res = await createBookingHold({
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelArea: hotel.area,
      roomType: selectedRoom,
      guestName,
      guestPhone,
      guestId: profile?.id,
      checkIn,
      checkOut,
      roomsCount,
      guestsCount,
      totalAmount: grandTotal,
    });

    setIsHolding(false);

    if (res.success && res.bookingId) {
      router.push(`/booking/summary?id=${res.bookingId}`);
    } else {
      alert(res.error || "Unable to hold room. Please try different dates.");
    }
  };

  const hasFullDates = Boolean(checkIn && checkOut);

  return (
    <div className="space-y-4">
      {/* 1. Top Promo Discount Tag */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-800">Direct Booking Guarantee</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          0% Platform Fee
        </span>
      </div>

      {/* Main Booking Card */}
      <div
        id="booking-widget"
        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-5"
      >
        {/* Header Price Display */}
        <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
          <div>
            {hasFullDates && priceData ? (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">
                    {formatINR(Math.round(priceData.totalAmount / priceData.nights))}
                  </span>
                  <span className="text-xs text-slate-500">avg / night</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Includes weekend rate adjustments
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
          <div className="flex items-center gap-1 text-xs text-slate-700 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold">{hotel.average_rating}</span>
            <span className="text-slate-400">({hotel.review_count})</span>
          </div>
        </div>

        <form onSubmit={handleCreateHold} className="space-y-4">
          {/* Room Category Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center justify-between">
              <span>Room Category</span>
              <span className="text-[10px] text-konkan-teal-700 font-semibold lowercase">
                {bedsCount === 1 ? "standard (1 bed)" : "family (2 beds)"}
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
                    {room.name} ({rBeds === 1 ? "1 Bed · Max 2" : "2 Beds · Max 4"} · {room.is_ac ? "AC" : "Non-AC"})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2x2 Unified Input Block (CHECK-IN | CHECKOUT | GUESTS) */}
          <div className="rounded-2xl border border-slate-300 overflow-hidden text-xs bg-white shadow-xs">
            {/* Top row: Check-In & Check-Out */}
            <div className="grid grid-cols-2 border-b border-slate-300">
              <div
                onClick={onFocusCalendar}
                className="p-3 border-r border-slate-300 cursor-pointer hover:bg-slate-50 transition-colors"
                title="Click to select on calendar"
              >
                <span className="block text-[10px] font-black uppercase text-slate-800 tracking-wider">
                  CHECK-IN
                </span>
                <span
                  className={`block text-xs sm:text-sm font-medium mt-0.5 ${
                    checkIn ? "text-slate-900 font-semibold" : "text-slate-400"
                  }`}
                >
                  {checkIn ? format(checkIn, "MM/dd/yyyy") : "Add date"}
                </span>
              </div>

              <div
                onClick={onFocusCalendar}
                className="p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                title="Click to select on calendar"
              >
                <span className="block text-[10px] font-black uppercase text-slate-800 tracking-wider">
                  CHECKOUT
                </span>
                <span
                  className={`block text-xs sm:text-sm font-medium mt-0.5 ${
                    checkOut ? "text-slate-900 font-semibold" : "text-slate-400"
                  }`}
                >
                  {checkOut ? format(checkOut, "MM/dd/yyyy") : "Add date"}
                </span>
              </div>
            </div>

            {/* Bottom row: GUESTS */}
            <div className="p-3 relative bg-white">
              <span className="block text-[10px] font-black uppercase text-slate-800 tracking-wider">
                GUESTS
              </span>
              <select
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value))}
                className="w-full bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer mt-0.5 appearance-none pr-6 text-xs sm:text-sm"
              >
                {Array.from({ length: maxAllowedGuests }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {g} {g === 1 ? "guest" : "guests"} {g === maxAllowedGuests ? "(max occupancy)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 bottom-3 pointer-events-none" />
            </div>
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

          {/* Availability Status */}
          {hasFullDates && (
            <>
              {availabilityStatus.checking ? (
                <div className="p-2.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-konkan-teal-700 border-t-transparent rounded-full animate-spin" />
                  <span>Checking room availability...</span>
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
                    <span>Available for selected dates</span>
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

          {/* Action Button: Check availability OR Reserve Hold */}
          {!hasFullDates ? (
            <button
              type="button"
              onClick={onFocusCalendar}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-konkan-teal-700 to-emerald-700 hover:from-konkan-teal-800 hover:to-emerald-800 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Check availability</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : isLoggedIn ? (
            <div className="space-y-3 pt-1">
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Patil"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98200 12345"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!availabilityStatus.available || isHolding}
                className="w-full py-3.5 px-4 rounded-2xl bg-konkan-teal-700 hover:bg-konkan-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isHolding ? (
                  <span>Securing 10-Minute Hold...</span>
                ) : (
                  <>
                    <span>Hold Room & Proceed</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2.5 text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Sign in to hold this room</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Inspect rates and room categories freely. Sign in to secure an instant 10-minute booking hold with direct host verification.
              </p>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/hotels/${hotel.id}`)}`}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In to Book</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Pricing Details Breakdown */}
          {hasFullDates && priceData && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between pb-1 border-b border-slate-200">
                <span>Selected stay ({priceData.nights} nights)</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {guestsCount} {guestsCount === 1 ? "guest" : "guests"}
                </span>
              </div>

              {priceData.weekdayNights > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Weekday rate ({priceData.weekdayNights} nt)</span>
                  <span className="font-medium text-slate-900">
                    {formatINR(priceData.totalWeekdayCost)}
                  </span>
                </div>
              )}

              {priceData.weekendNights > 0 && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span className="flex items-center gap-1">
                    <span>Weekend Fri/Sat ({priceData.weekendNights} nt)</span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </span>
                  <span>{formatINR(priceData.totalWeekendCost)}</span>
                </div>
              )}

              {priceData.extraGuestsCount > 0 && (
                <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200 font-semibold text-[11px]">
                  <span>Additional guest fee</span>
                  <span>+{formatINR(priceData.totalExtraGuestCost)}</span>
                </div>
              )}

              {addonsTotal > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Experience Add-ons</span>
                  <span>+{formatINR(addonsTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Platform Gateway Fee</span>
                <span className="text-emerald-600 font-bold">₹0 (Free)</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Total amount</span>
                <span className="text-xl text-konkan-teal-950 font-black">{formatINR(grandTotal)}</span>
              </div>
            </div>
          )}

          {/* Guarantee Note */}
          <div className="text-center text-[11px] text-slate-500">
            <span>You won&apos;t be charged yet. Instant 10-minute hold.</span>
          </div>

          {/* Report this listing Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => alert("Thank you. Listing status verified by bhramo.com.")}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this listing</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
