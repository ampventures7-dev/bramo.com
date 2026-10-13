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
  UserCheck
} from "lucide-react";

interface RoomBookingWidgetProps {
  hotel: HotelWithDetails;
  selectedRoomId?: string;
}

export function RoomBookingWidget({ hotel, selectedRoomId }: RoomBookingWidgetProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const isLoggedIn = Boolean(user || profile);

  const [selectedRoom, setSelectedRoom] = useState<RoomType>(
    hotel.room_types.find((r) => r.id === selectedRoomId) || hotel.room_types[0]
  );

  const [checkIn, setCheckIn] = useState<string>(format(startOfToday(), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState<string>(format(addDays(startOfToday(), 2), "yyyy-MM-dd"));
  const [roomsCount, setRoomsCount] = useState<number>(1);
  const [guestsCount, setGuestsCount] = useState<number>(2);

  // Capacity calculation based on bed rules:
  // Standard room with single bed = max 2 guests per room
  // Single room with 2 beds = max 4 guests per room
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

  // Re-calculate price and check availability whenever dates/room/guests change
  useEffect(() => {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return;

    // Check price with comparative guest scaling & weekend logic
    const result = calculatePriceWithWeekends(
      Number(selectedRoom.base_price),
      Number(selectedRoom.weekend_price),
      inDate,
      outDate,
      roomsCount,
      guestsCount,
      bedsCount,
      selectedRoom.extra_guest_fee
    );
    setPriceData(result);

    // Check availability
    let isCancelled = false;
    async function runAvailabilityCheck() {
      setAvailabilityStatus({ checking: true, available: false });
      const res = await checkRoomAvailability(selectedRoom.id, inDate, outDate, roomsCount);
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

  const handleCreateHold = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/hotels/${hotel.id}`)}`);
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

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    const res = await createBookingHold({
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelArea: hotel.area,
      roomType: selectedRoom,
      guestName,
      guestPhone,
      guestId: profile?.id,
      checkIn: inDate,
      checkOut: outDate,
      roomsCount,
      guestsCount,
      totalAmount: priceData?.totalAmount || Number(selectedRoom.base_price),
    });

    setIsHolding(false);

    if (res.success && res.bookingId) {
      // Redirect to Booking Summary Page with 10-minute hold active!
      router.push(`/booking/summary?id=${res.bookingId}`);
    } else {
      alert(res.error || "Unable to hold room. Please try different dates.");
    }
  };

  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-konkan-sand-200 shadow-xl space-y-6">
      {/* Header with Dynamic Pricing based on Guests Count */}
      <div className="flex items-baseline justify-between border-b border-konkan-sand-100 pb-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-konkan-teal-950">
              {formatINR(priceData?.effectiveNightlyRate || Number(selectedRoom.base_price))}
            </span>
            <span className="text-xs text-slate-500">
              {" "}/ night ({guestsCount} {guestsCount === 1 ? "guest" : "guests"})
            </span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
            Base Weekday: {formatINR(Number(selectedRoom.base_price))} · Weekend (Fri/Sat): {formatINR(Number(selectedRoom.weekend_price))}
          </div>
          {priceData && priceData.extraGuestsCount > 0 && (
            <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
              <span>
                ● Scaled: +{formatINR(priceData.extraGuestCostPerNight * priceData.extraGuestsCount)}/night for {priceData.extraGuestsCount} additional guest{priceData.extraGuestsCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <div className="text-right">
          <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Instant 10-Min Hold
          </span>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            {bedsCount === 1 ? "1 Bed · Max 2 Guests" : "2 Beds · Max 4 Guests"}
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateHold} className="space-y-4">
        {/* 1. Room Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
            <span>Select Room Category</span>
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
            className="w-full p-2.5 border border-konkan-sand-300 rounded-xl text-xs sm:text-sm font-semibold bg-konkan-sand-50/60 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
          >
            {hotel.room_types.map((room) => {
              const rBeds = room.beds_count || (room.capacity > 2 ? 2 : 1);
              const rMax = rBeds === 2 ? 4 : 2;
              return (
                <option key={room.id} value={room.id}>
                  {room.name} ({rBeds === 1 ? "1 Bed · Max 2 Guests" : "2 Beds · Max 4 Guests"} · {room.is_ac ? "AC" : "Non-AC"})
                </option>
              );
            })}
          </select>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700">Bed Setup:</span>
              <span>{selectedRoom.bed_type || (bedsCount === 1 ? "1 Bed (Standard)" : "2 Beds (Family)")}</span>
            </span>
            <span className="font-bold text-konkan-teal-800 bg-konkan-teal-50 px-2 py-0.5 rounded border border-konkan-teal-200 text-[10px]">
              Max {maxGuestsPerRoom} Guests / Room
            </span>
          </div>
        </div>

        {/* 2. Check-in & Check-out Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Check-in Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                min={format(startOfToday(), "yyyy-MM-dd")}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full p-2.5 border border-konkan-sand-300 rounded-xl text-xs sm:text-sm font-medium bg-konkan-sand-50/60 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Check-out Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                min={checkIn || format(startOfToday(), "yyyy-MM-dd")}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full p-2.5 border border-konkan-sand-300 rounded-xl text-xs sm:text-sm font-medium bg-konkan-sand-50/60 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
              />
            </div>
          </div>
        </div>

        {/* 3. Rooms & Guests Count with Bed Capacity Constraints */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Rooms Count
            </label>
            <select
              value={roomsCount}
              onChange={(e) => setRoomsCount(Number(e.target.value))}
              className="w-full p-2.5 border border-konkan-sand-300 rounded-xl text-xs sm:text-sm bg-konkan-sand-50/60 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600 font-semibold"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "Room" : "Rooms"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
              <span>Total Guests</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Max {maxAllowedGuests}
              </span>
            </label>
            <select
              value={guestsCount}
              onChange={(e) => setGuestsCount(Number(e.target.value))}
              className="w-full p-2.5 border border-konkan-sand-300 rounded-xl text-xs sm:text-sm bg-konkan-sand-50/60 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600 font-semibold"
            >
              {Array.from({ length: maxAllowedGuests }, (_, i) => i + 1).map((g) => {
                const baseCovered = (bedsCount === 2 ? 2 : 1) * roomsCount;
                const extra = g > baseCovered ? g - baseCovered : 0;
                const extraRate = selectedRoom.extra_guest_fee || (bedsCount === 2 ? 500 : 400);

                let label = `${g} ${g === 1 ? "Guest" : "Guests"}`;
                if (bedsCount === 1 && roomsCount === 1) {
                  if (g === 1) label = "1 Guest (Single Base Rate)";
                  if (g === 2) label = `2 Guests (+₹${extraRate}/nt · Max for 1 Bed)`;
                } else if (bedsCount === 2 && roomsCount === 1) {
                  if (g <= 2) label = `${g} ${g === 1 ? "Guest" : "Guests"} (Base Rate)`;
                  if (g === 3) label = `3 Guests (+₹${extraRate}/nt)`;
                  if (g === 4) label = `4 Guests (+₹${extraRate * 2}/nt · Max for 2 Beds)`;
                } else if (extra > 0) {
                  label = `${g} Guests (+₹${extra * extraRate}/nt)`;
                }

                return (
                  <option key={g} value={g}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Capacity Guideline Notice */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0 mt-0.5" />
          <span>
            {bedsCount === 1
              ? `Standard room (1 bed) strictly allows up to 2 guests (${roomsCount} room = max ${maxAllowedGuests} guests). Price scales with occupancy.`
              : `Family room (2 beds) allows up to 4 guests (${roomsCount} room = max ${maxAllowedGuests} guests). Price scales with occupancy.`}
          </span>
        </div>

        {/* Live Availability Status Banner */}
        {availabilityStatus.checking ? (
          <div className="p-3 bg-konkan-sand-100 rounded-xl text-xs text-slate-600 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-konkan-teal-700 border-t-transparent rounded-full animate-spin" />
            <span>Checking real-time room availability...</span>
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
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Available for selected dates</span>
            </div>
            {availabilityStatus.remainingRooms !== undefined && (
              <span className="text-[11px] text-emerald-700 font-medium">
                {availabilityStatus.remainingRooms} rooms left
              </span>
            )}
          </div>
        )}

        {/* Price Breakdown with Fri/Sat Weekend and Comparative Guest Scaling */}
        {priceData && (
          <div className="p-4 bg-konkan-sand-50/80 rounded-2xl border border-konkan-sand-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Price Summary ({priceData.nights} nights)</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {roomsCount} {roomsCount === 1 ? "room" : "rooms"} · {guestsCount} {guestsCount === 1 ? "guest" : "guests"}
              </span>
            </div>

            {priceData.weekdayNights > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>
                  Weekday Base Rate ({priceData.weekdayNights} night{priceData.weekdayNights > 1 ? "s" : ""})
                </span>
                <span className="font-medium text-slate-800">
                  {formatINR(priceData.totalWeekdayCost)}
                </span>
              </div>
            )}

            {priceData.weekendNights > 0 && (
              <div className="flex justify-between text-amber-800 font-medium">
                <span className="flex items-center gap-1">
                  <span>Weekend Fri/Sat ({priceData.weekendNights} night{priceData.weekendNights > 1 ? "s" : ""})</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </span>
                <span>{formatINR(priceData.totalWeekendCost)}</span>
              </div>
            )}

            {/* Additional Guests Surcharge */}
            {priceData.extraGuestsCount > 0 && (
              <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200 font-semibold">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    Additional Guest Surcharge ({priceData.extraGuestsCount} extra guest{priceData.extraGuestsCount > 1 ? "s" : ""} × {priceData.nights} nt @ {formatINR(priceData.extraGuestCostPerNight)}/nt)
                  </span>
                </span>
                <span className="font-bold text-emerald-900">+ {formatINR(priceData.totalExtraGuestCost)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-konkan-sand-200 flex justify-between items-baseline text-sm font-black text-konkan-teal-950">
              <div className="space-y-0.5">
                <span className="block">Total Price:</span>
                <span className="text-[10px] font-normal text-slate-500 block">
                  Avg {formatINR(priceData.effectiveNightlyRate)} / night for {guestsCount} {guestsCount === 1 ? "guest" : "guests"}
                </span>
              </div>
              <span className="text-xl text-konkan-teal-900 font-black">{formatINR(priceData.totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Hold Guarantee Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-konkan-sand-100">
          <Clock className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
          <span>Rooms are held for 10 minutes upon proceeding to avoid double bookings.</span>
        </div>

        {/* Conditional Gate: If Logged In, show guest form and submit button; Else show login prompt */}
        {isLoggedIn ? (
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">
                    Signed In: {profile?.name || user?.email}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {profile?.phone || "Verified Guest"}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Ready to Book
              </span>
            </div>

            {/* Guest Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Patil"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2.5 border border-konkan-sand-300 rounded-xl text-xs sm:text-sm bg-konkan-sand-50/60 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  WhatsApp Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98200 12345"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full p-2.5 border border-konkan-sand-300 rounded-xl text-xs sm:text-sm bg-konkan-sand-50/60 focus:outline-none focus:ring-1 focus:ring-konkan-teal-600"
                />
              </div>
            </div>

            {/* Submit Hold Button */}
            <button
              type="submit"
              disabled={!availabilityStatus.available || isHolding}
              className="w-full py-3.5 px-4 rounded-2xl bg-konkan-teal-700 hover:bg-konkan-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
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
          <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 to-konkan-sand-100/70 rounded-2xl border border-amber-200/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Sign In Required to Book</span>
                  <span className="text-[11px] text-amber-800">Inspection & Rate Check Active</span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                Inspection Mode
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              You can inspect room options, photos, and calculate rates freely. To hold this room and secure your booking pass, please sign in.
            </p>

            <Link
              href={`/login?redirect=${encodeURIComponent(`/hotels/${hotel.id}`)}`}
              className="w-full py-3.5 px-4 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register to Book</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
