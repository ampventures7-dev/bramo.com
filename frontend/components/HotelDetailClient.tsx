"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { HotelWithDetails } from "@/lib/hotels-service";
import { RoomType } from "@/types/supabase";
import { RoomBookingWidget } from "@/components/RoomBookingWidget";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import { getLocalReviews } from "@/lib/review-service";
import { TravelRouteGuide } from "@/components/TravelRouteGuide";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Star,
  Users,
  Wind,
  Check,
  Phone,
  MessageSquare,
  Clock,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  CalendarCheck,
  Lock
} from "lucide-react";

interface HotelDetailClientProps {
  hotel: HotelWithDetails;
}

export function HotelDetailClient({ hotel }: HotelDetailClientProps) {
  const { user, profile } = useAuth();
  const isLoggedIn = Boolean(user || profile);

  const [activeImage, setActiveImage] = useState<string>(hotel.images[0] || "");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(hotel.room_types[0]?.id || "");
  const [allReviews, setAllReviews] = useState(hotel.reviews || []);

  useEffect(() => {
    try {
      const local = getLocalReviews();
      const matching = local.filter((r) => r.hotel_id === hotel.id);
      if (matching.length > 0) {
        // Merge without duplicates
        const existingIds = new Set((hotel.reviews || []).map((r) => r.id));
        const newLocal = matching.filter((r) => !existingIds.has(r.id));
        setAllReviews([...newLocal, ...(hotel.reviews || [])]);
      }
    } catch {
      // ignore
    }
  }, [hotel.id, hotel.reviews]);

  const phone = hotel.whatsapp_number || "919422388200";
  const defaultMsg = `Hi, I am interested in inquiring about staying at *${hotel.name}* in ${hotel.area}.`;
  const waLink = getWhatsAppLink(phone, defaultMsg);

  const handleSelectRoomToBook = (room: RoomType) => {
    setSelectedRoomId(room.id);
    const widget = document.getElementById("booking-widget");
    if (widget) {
      widget.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Google Maps embed URL using coordinates
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${hotel.lat},${hotel.lng}&hl=en&z=15&output=embed`;
  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lng}`;

  return (
    <div className="space-y-10 pb-28">
      {/* Back button */}
      <div>
        <Link
          href="/hotels"
          className="inline-flex items-center gap-1 text-xs font-bold text-konkan-teal-800 hover:text-konkan-teal-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Stays in Dapoli & Harnai</span>
        </Link>
      </div>

      {/* Hotel Title & Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-konkan-teal-800 text-white shadow-sm">
              {hotel.area}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-konkan-teal-600" />
              <span>{hotel.address}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {hotel.name}
          </h1>
        </div>

        {/* Rating summary */}
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-amber-900 self-start sm:self-auto">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-extrabold text-base">{hotel.average_rating}</span>
          <span className="text-xs text-slate-500">({hotel.review_count} verified reviews)</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. IMAGE GALLERY */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="relative h-72 sm:h-[460px] w-full rounded-3xl overflow-hidden shadow-md border border-konkan-sand-200 bg-slate-100">
          <Image
            src={activeImage || hotel.images[0]}
            alt={hotel.name}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-all duration-300"
          />
        </div>

        {/* Thumbnail Selector */}
        {hotel.images.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {hotel.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`relative w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  activeImage === img
                    ? "border-konkan-teal-700 ring-2 ring-konkan-teal-700/30 scale-102"
                    : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`${hotel.name} photo ${idx + 1}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ========================================================= */}
        {/* LEFT 2 COLS: Description, Amenities, Map, Rooms, Reviews */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 space-y-10">
          {/* Description */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">About the Property</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {hotel.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-konkan-sand-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-konkan-teal-600" />
                <span>
                  Check-in: <strong className="text-slate-800">{hotel.checkin_time}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-konkan-teal-600" />
                <span>
                  Check-out: <strong className="text-slate-800">{hotel.checkout_time}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Property Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hotel.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-slate-700 bg-konkan-sand-50/70 p-2.5 rounded-xl border border-konkan-sand-200/60"
                >
                  <div className="w-5 h-5 rounded-full bg-konkan-teal-100 text-konkan-teal-800 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* ROOM CATEGORIES LIST */}
          {/* ========================================================= */}
          <div id="rooms-section" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
                  Options & Rates
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Room Categories
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                {hotel.room_types.length} room {hotel.room_types.length === 1 ? "type" : "types"} available
              </span>
            </div>

            <div className="space-y-4">
              {hotel.room_types.map((room) => (
                <div
                  key={room.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-konkan-sand-200 shadow-sm hover:border-konkan-teal-300 transition-all flex flex-col md:flex-row gap-5"
                >
                  {/* Room Thumbnail */}
                  <div className="relative w-full md:w-44 h-40 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <Image
                      src={hotel.images[1] || hotel.images[0]}
                      alt={room.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 176px"
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm text-white ${
                          room.is_ac ? "bg-cyan-700" : "bg-amber-700"
                        }`}
                      >
                        {room.is_ac ? "Air Conditioned" : "Non-AC / Eco Chira"}
                      </span>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900">
                          {room.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-bold bg-konkan-teal-50 text-konkan-teal-900 border border-konkan-teal-200 px-2.5 py-1 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-konkan-teal-700" />
                          <span>
                            {(room.beds_count || (room.capacity > 2 ? 2 : 1)) === 1
                              ? "1 Bed · Max 2 Guests"
                              : "2 Beds · Max 4 Guests"}
                          </span>
                        </span>
                        <span className="text-[11px] font-medium bg-konkan-sand-100 text-slate-700 px-2.5 py-1 rounded-lg">
                          🛏️ {room.bed_type || ((room.beds_count || (room.capacity > 2 ? 2 : 1)) === 1 ? "1 Bed (Standard)" : "2 Beds (Family)")}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 text-[11px]">{room.total_rooms} rooms inventory</span>
                      </div>

                      {/* Room Amenities */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {room.amenities.map((item, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium bg-konkan-sand-50 text-slate-700 px-2 py-0.5 rounded-md border border-konkan-sand-200"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price and Book Room Button */}
                    <div className="pt-3 border-t border-konkan-sand-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-konkan-teal-900">
                            {formatINR(Number(room.base_price))}
                          </span>
                          <span className="text-xs text-slate-500">/ weekday</span>
                        </div>
                        <div className="text-[11px] text-amber-700 font-semibold">
                          Weekend (Fri/Sat): {formatINR(Number(room.weekend_price))}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Rates scale comparatively with guest count
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectRoomToBook(room)}
                        className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-colors shadow-sm self-start sm:self-auto flex items-center gap-1.5 ${
                          isLoggedIn
                            ? "bg-konkan-teal-700 hover:bg-konkan-teal-800"
                            : "bg-slate-800 hover:bg-slate-900"
                        }`}
                      >
                        {!isLoggedIn && <Lock className="w-3.5 h-3.5 text-amber-300" />}
                        <span>{isLoggedIn ? "Select & Book" : "Inspect Room"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Room Capacity Policy Banner */}
            <div className="p-4 rounded-2xl bg-konkan-sand-50 border border-konkan-sand-200 text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-konkan-teal-700" />
                <span>Guest Occupancy & Room Capacity Policy</span>
              </div>
              <ul className="text-[11px] space-y-1 text-slate-600 list-disc list-inside">
                <li><strong>Standard Size Room (1 Bed):</strong> Strictly accommodates up to <strong>2 guests maximum</strong> per room.</li>
                <li><strong>Family Room (2 Beds):</strong> Accommodates up to <strong>4 guests maximum</strong> per room.</li>
                <li><strong>Comparative Guest Pricing:</strong> Room rates adjust comparatively as guest occupancy increases.</li>
              </ul>
            </div>
          </div>

          {/* ========================================================= */}
          {/* GOOGLE MAPS EMBED */}
          {/* ========================================================= */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Map & Surroundings</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Located in {hotel.area}, Maharashtra ({hotel.lat}, {hotel.lng})
                </p>
              </div>
              <a
                href={googleMapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-konkan-teal-700 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Google Maps responsive embed */}
            <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-konkan-sand-200">
              <iframe
                title={`Map location of ${hotel.name}`}
                src={googleMapsEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* REVIEWS SECTION */}
          {/* ========================================================= */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-konkan-sand-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-konkan-sand-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Guest Reviews</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified guest experiences at {hotel.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-konkan-teal-50 px-3 py-1.5 rounded-xl border border-konkan-teal-200 text-konkan-teal-900 font-extrabold text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{hotel.average_rating} / 5</span>
              </div>
            </div>

            {allReviews && allReviews.length > 0 ? (
              <div className="space-y-4">
                {allReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Verified Stay"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No reviews yet. Be the first guest to share your experience!
              </p>
            )}
          </div>

          {/* Mumbai & Pune Travel & Driving Route Guide (Feature 3) */}
          <TravelRouteGuide area={hotel.area} />
        </div>

        {/* ========================================================= */}
        {/* RIGHT 1 COL: Interactive Room Booking Widget */}
        {/* ========================================================= */}
        <div id="booking-widget" className="space-y-4">
          <div className="sticky top-20 space-y-4">
            <RoomBookingWidget hotel={hotel} selectedRoomId={selectedRoomId} />

            <div className="p-4 bg-white rounded-2xl border border-konkan-sand-200 text-center space-y-2 shadow-sm">
              <span className="text-xs text-slate-500 block">Need custom dates or large group queries?</span>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Hotel Host</span>
              </a>
            </div>

            {/* Direct Host Contact Policy Reassurance Window (Feature 11) */}
            <div className="p-4 bg-konkan-sand-50/80 rounded-2xl border border-konkan-sand-200 text-left text-xs space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct Host Contact Policy</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Host direct mobile number, landmark navigation instructions, and arrival coordination are unlocked immediately upon 15% advance booking confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* STICKY BOTTOM ACTION BAR (FOR MOBILE & EASY DESKTOP ACCESS) */}
      {/* ========================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-konkan-sand-300 px-4 py-3 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">
              {hotel.name}
            </span>
            <div className="text-base sm:text-lg font-black text-konkan-teal-900">
              {formatINR(hotel.starting_price)}
              <span className="text-xs font-normal text-slate-500"> / night</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp Hotel</span>
            </a>

            <button
              type="button"
              onClick={() => {
                const widget = document.getElementById("booking-widget");
                if (widget) widget.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 ${
                isLoggedIn
                  ? "bg-konkan-teal-700 hover:bg-konkan-teal-800"
                  : "bg-slate-900 hover:bg-black"
              }`}
            >
              {isLoggedIn ? (
                <CalendarCheck className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-amber-300" />
              )}
              <span>{isLoggedIn ? "Book Now" : "Sign In to Book"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
