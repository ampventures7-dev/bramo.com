"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { startOfToday, addDays } from "date-fns";
import { HotelWithDetails } from "@/lib/hotels-service";
import { RoomType } from "@/types/supabase";
import { RoomBookingWidget } from "@/components/RoomBookingWidget";
import { DualMonthCalendar } from "@/components/DualMonthCalendar";
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
  Lock,
  Compass,
  Car,
  Footprints,
  Images
} from "lucide-react";

interface HotelDetailClientProps {
  hotel: HotelWithDetails;
}

export function HotelDetailClient({ hotel }: HotelDetailClientProps) {
  const { user, profile } = useAuth();
  const isLoggedIn = Boolean(user || profile);

  const images = hotel.images && hotel.images.length > 0 ? hotel.images : ["/hero/hero-1.jpg"];
  const [activeImage, setActiveImage] = useState<string>(images[0]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(hotel.room_types[0]?.id || "");
  const [allReviews, setAllReviews] = useState(hotel.reviews || []);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Synchronized travel dates for DualMonthCalendar and RoomBookingWidget
  const [checkIn, setCheckIn] = useState<Date | null>(startOfToday());
  const [checkOut, setCheckOut] = useState<Date | null>(addDays(startOfToday(), 2));

  const handleSelectDates = (newIn: Date | null, newOut: Date | null) => {
    setCheckIn(newIn);
    setCheckOut(newOut);
  };

  const handleFocusCalendar = () => {
    const section = document.getElementById("date-selector-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    try {
      const local = getLocalReviews();
      const matching = local.filter((r) => r.hotel_id === hotel.id);
      if (matching.length > 0) {
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
    <div className="space-y-10 pb-28 bg-[#faf8f5]">
      {/* Back button */}
      <div>
        <Link
          href="/hotels"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-konkan-teal-800 hover:text-konkan-teal-950 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Stays in Dapoli & Harnai</span>
        </Link>
      </div>

      {/* Hotel Title & Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-konkan-teal-800 text-white shadow-sm">
              {hotel.area} Coast
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-konkan-teal-600" />
              <span>{hotel.address}</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            {hotel.name}
          </h1>
        </div>

        {/* Rating summary */}
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-amber-900 self-start sm:self-auto shadow-xs">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-black text-base">{hotel.average_rating}</span>
          <span className="text-xs text-slate-500">({hotel.review_count} verified reviews)</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ASYMMETRIC 5-PHOTO LUXURY GALLERY GRID (Aman/Luxe Style) */}
      {/* ========================================================= */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 bg-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[340px] sm:h-[480px]">
          {/* Main Large Hero Image (Spans 2 columns) */}
          <div
            onClick={() => setActiveImage(images[0])}
            className="md:col-span-2 relative h-full cursor-pointer overflow-hidden group"
          >
            <Image
              src={images[0]}
              alt={`${hotel.name} main showcase`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Secondary 2x2 Grid on Desktop */}
          <div className="hidden md:grid col-span-2 grid-cols-2 gap-2 h-full">
            {images.slice(1, 5).map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveImage(img)}
                className="relative h-full cursor-pointer overflow-hidden group bg-slate-900"
              >
                <Image
                  src={img}
                  alt={`${hotel.name} photo ${i + 2}`}
                  fill
                  sizes="25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* View All Photos Button Overlay */}
        <button
          type="button"
          onClick={() => setIsPhotoModalOpen(true)}
          className="absolute bottom-4 right-4 z-10 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-900 text-xs font-bold backdrop-blur-md shadow-xl transition-all flex items-center gap-2 hover:scale-105"
        >
          <Images className="w-4 h-4 text-konkan-teal-700" />
          <span>View all {images.length} photos</span>
        </button>
      </div>

      {/* Lightbox / Modal for All Photos */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/20 text-white">
            <h3 className="font-bold text-sm sm:text-base">{hotel.name} Photo Gallery</h3>
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(false)}
              className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
            >
              Close ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto w-full">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg"
              >
                <Image
                  src={img}
                  alt={`${hotel.name} gallery image ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ========================================================= */}
        {/* LEFT 2 COLS: Description, Amenities, Map, Rooms, Reviews */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 space-y-10">
          {/* Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-2xl font-black text-slate-900">About the Sanctuary</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {hotel.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Curated Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hotel.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/80"
                >
                  <div className="w-5 h-5 rounded-full bg-konkan-teal-100 text-konkan-teal-800 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* LOCAL NEIGHBORHOOD TIMELINE (Walking & Driving Highlights) */}
          {/* ========================================================= */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
                Local Neighborhood
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Walking & Driving Distance Guide
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-900">
                    Murud Beach Watersports
                  </strong>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    🚶 3 - 5 min walk (150m)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Banana rides, bumper boats, jet skis, and morning dolphin safaris.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-900">
                    Ladghar Red Pebble Sunset
                  </strong>
                  <span className="text-[11px] text-amber-800 font-semibold">
                    🚗 10 min drive (4.8 km)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Renowned Tamas Tirtha beach with glowing crimson sand and seaside cafes.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-900">
                    Harnai Port & Fish Auction
                  </strong>
                  <span className="text-[11px] text-cyan-900 font-semibold">
                    🚗 14 min drive (8.2 km)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Suvarnadurg sea-fort ferry boarding & vibrant 4 PM coastal fish auction.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-900">
                    Keshavraj Rainforest Temple
                  </strong>
                  <span className="text-[11px] text-teal-900 font-semibold">
                    🚗 20 min drive (11 km)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scenic stone pathway through betel-nut groves with natural freshwater spring.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* ROOM CATEGORIES LIST */}
          {/* ========================================================= */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Available Room Types</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the best room configuration for your travel party
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotel.room_types.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const rBeds = room.beds_count || (room.capacity > 2 ? 2 : 1);
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? "border-konkan-teal-700 bg-konkan-teal-50/40 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-konkan-teal-800">
                          {rBeds === 1 ? "1 Bed · Max 2" : "2 Beds · Max 4"}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {formatINR(Number(room.base_price))} / night
                        </span>
                      </div>

                      <h3 className="font-black text-base text-slate-900">{room.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {room.bed_type || (rBeds === 1 ? "1 Queen Bed" : "2 Double Beds")} • Up to {room.capacity} guests
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                          {room.is_ac ? "❄️ AC Room" : "🌿 Non-AC Eco"}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                          👥 Up to {room.capacity} Guests
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRoomToBook(room);
                      }}
                      className={`w-full py-2.5 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-konkan-teal-800 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                      }`}
                    >
                      <span>{isSelected ? "Selected for Booking" : "Select this Room"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* DUAL-MONTH INTERACTIVE CALENDAR */}
          {/* ========================================================= */}
          <div id="date-selector-section">
            <DualMonthCalendar
              checkIn={checkIn}
              checkOut={checkOut}
              onSelectDates={handleSelectDates}
            />
          </div>

          {/* ========================================================= */}
          {/* MAP & LOCATION SECTION */}
          {/* ========================================================= */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Location & Surroundings</h2>
                <p className="text-xs text-slate-500 mt-0.5">{hotel.address}</p>
              </div>
              <a
                href={googleMapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-konkan-teal-800 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-200">
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Guest Reviews</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified guest experiences at {hotel.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 text-amber-900 font-black text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{hotel.average_rating} / 5</span>
              </div>
            </div>

            {allReviews && allReviews.length > 0 ? (
              <div className="space-y-4">
                {allReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
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

          {/* Mumbai & Pune Travel & Driving Route Guide */}
          <TravelRouteGuide area={hotel.area} />
        </div>

        {/* ========================================================= */}
        {/* RIGHT COL: STICKY CONCIERGE BOOKING WIDGET                */}
        {/* ========================================================= */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <RoomBookingWidget
              hotel={hotel}
              selectedRoomId={selectedRoomId}
              checkInDate={checkIn}
              checkOutDate={checkOut}
              onDatesChange={handleSelectDates}
              onFocusCalendar={handleFocusCalendar}
            />

            {/* Direct Host WhatsApp Contact Pill */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Prefer to speak with the Host directly?</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connect on WhatsApp for custom group discounts, late check-in notice, or special Konkani seafood meal requests.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
