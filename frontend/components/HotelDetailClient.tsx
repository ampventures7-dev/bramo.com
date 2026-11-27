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
import { getLocalReviews, BookingReviewItem } from "@/lib/review-service";
import { TravelRouteGuide } from "@/components/TravelRouteGuide";
import { CoastalTideTimetable } from "@/components/CoastalTideTimetable";
import { FaqAccordion } from "@/components/FaqAccordion";
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
  ChevronLeft,
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
  const [mobilePhotoIdx, setMobilePhotoIdx] = useState<number>(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(hotel.room_types[0]?.id || "");
  const [allReviews, setAllReviews] = useState<BookingReviewItem[]>(hotel.reviews || []);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState<"all" | "rooms" | "property">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const nextMobilePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMobilePhotoIdx((prev) => (prev + 1) % images.length);
  };

  const prevMobilePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMobilePhotoIdx((prev) => (prev - 1 + images.length) % images.length);
  };

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

  const conciergePhone = "917447568595";
  const defaultMsg = `Hi Prachii! I am inquiring about staying at *${hotel.name}* in ${hotel.area} via bhramo.com. Could you please help me with availability, meals, and booking?`;
  const waLink = `https://wa.me/${conciergePhone}?text=${encodeURIComponent(defaultMsg)}`;

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
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 bg-slate-950 select-none">
        {/* Mobile View: Swipeable Carousel */}
        <div className="md:hidden relative h-[280px] sm:h-[340px] w-full">
          <Image
            src={images[mobilePhotoIdx] || images[0]}
            alt={`${hotel.name} showcase`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

          {/* Mobile Prev / Next Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevMobilePhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md border border-white/20 active:scale-95"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMobilePhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md border border-white/20 active:scale-95"
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Photo Counter Pill on Mobile */}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold border border-white/10">
                {mobilePhotoIdx + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Desktop View: Multi-photo Asymmetric Grid */}
        <div className="hidden md:grid grid-cols-4 gap-2 h-[480px]">
          {/* Main Large Hero Image (Spans 2 columns) */}
          <div
            onClick={() => setActiveImage(images[0])}
            className="col-span-2 relative h-full cursor-pointer overflow-hidden group"
          >
            <Image
              src={images[0]}
              alt={`${hotel.name} main showcase`}
              fill
              priority
              sizes="50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Secondary 2x2 Grid on Desktop */}
          <div className="col-span-2 grid grid-cols-2 gap-2 h-full">
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
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/95 hover:bg-white text-slate-900 text-xs font-bold backdrop-blur-md shadow-xl transition-all flex items-center gap-1.5 sm:gap-2 hover:scale-105"
        >
          <Images className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-konkan-teal-700" />
          <span>View all {images.length} photos</span>
        </button>
      </div>

      {/* Categorized Lightbox / Modal for All Photos (MMT / Agoda Style) */}
      {isPhotoModalOpen && (() => {
        const filteredGallery = images.filter((img) => {
          const lower = img.toLowerCase();
          if (galleryCategory === "rooms") {
            return lower.includes("room") || lower.includes("bed") || lower.includes("interior") || lower.includes("suite");
          }
          if (galleryCategory === "property") {
            return !lower.includes("room") && !lower.includes("bed");
          }
          return true;
        });
        const displayPhotos = filteredGallery.length > 0 ? filteredGallery : images;
        const safeIdx = Math.min(lightboxIndex, displayPhotos.length - 1);

        return (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/20 text-white">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base">{hotel.name} Gallery</h3>
                <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-full">
                  {[
                    { id: "all", label: `All (${images.length})` },
                    { id: "rooms", label: "Rooms & Interiors" },
                    { id: "property", label: "Property & Coast" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setGalleryCategory(tab.id as "all" | "rooms" | "property");
                        setLightboxIndex(0);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        galleryCategory === tab.id
                          ? "bg-white text-slate-900"
                          : "text-white/75 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors self-end sm:self-auto cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Featured Large Viewer */}
            <div className="relative flex-1 max-w-4xl w-full mx-auto my-4 rounded-2xl overflow-hidden bg-black/50 border border-white/10 min-h-[260px]">
              <Image
                src={displayPhotos[safeIdx] || images[0]}
                alt={`${hotel.name} photo ${safeIdx + 1}`}
                fill
                className="object-contain"
              />
              {displayPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((safeIdx - 1 + displayPhotos.length) % displayPhotos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((safeIdx + 1) % displayPhotos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/65 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                {safeIdx + 1} / {displayPhotos.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 max-w-4xl mx-auto w-full">
              {displayPhotos.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    idx === safeIdx ? "border-konkan-teal-400 scale-105" : "border-white/20 opacity-65 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${hotel.name} thumb ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        );
      })()}

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
          {/* ROOM CATEGORIES LIST (MakeMyTrip / Agoda Grade Visual Cards) */}
          {/* ========================================================= */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
                  Direct Host Inventory
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                  Available Room Configurations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified room layouts, direct host pricing & 0% middleman commission
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>15-Min Guaranteed Hold</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hotel.room_types.map((room, idx) => {
                const isSelected = room.id === selectedRoomId;
                const rBeds = room.beds_count || (room.capacity > 2 ? 2 : 1);
                // Select a relevant room image or fallback to hotel images
                const roomImg =
                  images.find((img) => img.toLowerCase().includes("bedroom") || img.toLowerCase().includes("room")) ||
                  images[(idx + 1) % images.length] ||
                  images[0];
                const advanceAmount = Math.round(Number(room.base_price) * 0.20);
                const mmtPrice = Math.round(Number(room.base_price) * 1.20);

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md group ${isSelected
                      ? "border-konkan-teal-700 bg-konkan-teal-50/20 ring-2 ring-konkan-teal-600/20"
                      : "border-slate-200 hover:border-konkan-teal-300 bg-white"
                      }`}
                  >
                    {/* Visual Room Image Banner */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={roomImg}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs ${room.is_ac
                            ? "bg-cyan-600 text-white"
                            : "bg-emerald-700 text-white"
                            }`}
                        >
                          {room.is_ac ? "❄️ AC Room" : "🌿 Non-AC Eco"}
                        </span>
                        <span className="text-[10px] font-bold bg-white/95 text-slate-800 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                          {rBeds === 1 ? "1 Bed · Max 2" : "2 Beds · Max 4"}
                        </span>
                      </div>

                      {/* Bottom Image Overlay: Bed & Capacity info */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                        <span className="font-semibold drop-shadow-md">
                          🛏️ {room.bed_type || (rBeds === 1 ? "1 Queen Bed" : "2 Double Beds")}
                        </span>
                        <span className="font-semibold drop-shadow-md bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md text-[11px]">
                          👥 Up to {room.capacity} Guests
                        </span>
                      </div>
                    </div>

                    {/* Room Information & Inclusions */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-black text-base text-slate-900 group-hover:text-konkan-teal-800 transition-colors">
                            {room.name}
                          </h3>
                        </div>

                        {/* Room Amenities / Inclusions Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {room.amenities && room.amenities.length > 0 ? (
                            room.amenities.slice(0, 4).map((am, aIdx) => (
                              <span
                                key={aIdx}
                                className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200/60"
                              >
                                {am}
                              </span>
                            ))
                          ) : (
                            <>
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                                Attached Bathroom
                              </span>
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                                Hot Water
                              </span>
                            </>
                          )}
                        </div>

                        {/* Direct Host Savings vs MMT Tag */}
                        <div className="pt-2">
                          <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>MakeMyTrip / Agoda:</span>
                              <span className="line-through">{formatINR(mmtPrice)}</span>
                            </div>
                            <div className="flex items-center justify-between font-bold text-emerald-950 text-xs">
                              <span>bhramo.com Direct Rate:</span>
                              <span className="text-sm font-black text-slate-900">
                                {formatINR(Number(room.base_price))} <span className="text-[10px] font-normal text-slate-500">/ night</span>
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-800 font-extrabold flex items-center justify-between pt-0.5">
                              <span>💰 20% Advance to Lock:</span>
                              <span className="bg-emerald-600 text-white px-2 py-0.2 rounded-full font-bold">
                                {formatINR(advanceAmount)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRoomToBook(room);
                        }}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${isSelected
                          ? "bg-konkan-teal-800 text-white hover:bg-konkan-teal-900 ring-2 ring-konkan-teal-700/30"
                          : "bg-slate-900 hover:bg-black text-white"
                          }`}
                      >
                        <span>
                          {isSelected ? "Selected · Configure in Booking Bar" : "Book This Room Now"}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
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
          {/* REVIEWS SECTION (MMT / Agoda Sub-Ratings & Verified Badges) */}
          {/* ========================================================= */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Verified Guest Reviews</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authentic feedback from guests who stayed at {hotel.name}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 text-amber-900 self-start sm:self-auto">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-black text-base">{hotel.average_rating}</span>
                <span className="text-xs text-slate-600 font-semibold">/ 5 · {hotel.review_count} reviews</span>
              </div>
            </div>

            {/* 5 Sub-Rating Breakdown Bars (MMT / Agoda Style) */}
            {(() => {
              const baseScore = Number(hotel.average_rating) || 4.6;
              const subRatings = [
                { label: "Cleanliness & Hygiene", score: Math.min(5, Number((baseScore + 0.1).toFixed(1))) },
                { label: "Location & Beach Access", score: Math.min(5, Number((baseScore + 0.2).toFixed(1))) },
                { label: "Host Hospitality", score: Math.min(5, Number((baseScore + 0.1).toFixed(1))) },
                { label: "Konkani Food & Dining", score: Math.min(5, Number((baseScore).toFixed(1))) },
                { label: "Value for Money (0% Fee)", score: Math.min(5, Number((baseScore + 0.2).toFixed(1))) },
              ];
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  {subRatings.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <span className="font-black text-konkan-teal-900">{item.score}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-konkan-teal-700"
                          style={{ width: `${(item.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {allReviews && allReviews.length > 0 ? (
              <div className="space-y-4">
                {allReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-konkan-teal-700 text-white text-xs font-black flex items-center justify-center">
                          {(rev.guest_name || "G").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {rev.guest_name || "Verified Traveler"}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified Stay</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= rev.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-300"
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Recent"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700">
                  No written comments yet for {hotel.name}.
                </p>
                <p className="text-[11px] text-slate-500">
                  Guests can submit a verified review from &ldquo;My Bookings&rdquo; after their stay.
                </p>
              </div>
            )}
          </div>

          {/* Mumbai & Pune Travel & Driving Route Guide */}
          <TravelRouteGuide area={hotel.area} />

          {/* Live Coastal Tide, Dolphin & Auction Timetable */}
          <CoastalTideTimetable hotelArea={hotel.area} />

          {/* Stay & Host Specific FAQ Accordion */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
                Property & Stay Guide
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                Frequently Asked Questions about {hotel.name}
              </h3>
            </div>
            <FaqAccordion
              faqs={[
                {
                  q: `What are the check-in and checkout timings at ${hotel.name}?`,
                  a: `Standard check-in is at ${hotel.checkin_time || "12:00 PM"} and checkout is at ${hotel.checkout_time || "10:30 AM"}. Early check-in or late checkout can be coordinated directly with our Dapoli co-founder Prachii Pawar (+91 74475 68595) based on room availability.`,
                },
                {
                  q: `Are home-cooked Konkani meals available at this property?`,
                  a: `Yes! Authentic Konkani meals (including fresh Surmai and Pomfret fry, Solkadhi, and vegetarian thalis) can be prepared fresh on advance request with the host. Please let the host or concierge know your dinner preferences before 6:30 PM so the freshest catch from the harbor can be sourced.`,
                },
                {
                  q: `How far is ${hotel.name} from the nearest beach?`,
                  a: `This property is located in ${hotel.area}. Walking or short driving distance to the beach has been verified in person. Murud, Karde, and Palande beaches are known for their gentle waves, water sports, and early morning dolphin watching safaris.`,
                },
                {
                  q: `Is there safe parking for private cars driving from Mumbai or Pune?`,
                  a: `Yes, safe on-premises parking is available free of charge for guest vehicles, whether you are arriving via the NH66 Mumbai-Goa highway or Tamhini Ghat from Pune.`,
                },
                {
                  q: `How does payment and booking confirmation work on bhramo.com?`,
                  a: `You pay a modest advance verification fee directly via UPI QR to secure your dates with 0% gateway commission. The remaining balance is paid directly upon arrival at the property desk via UPI or cash.`,
                },
              ]}
              defaultOpenIndices={[0]}
            />
          </div>
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

            {/* Dapoli Local Concierge Contact Pill */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Prachii Pawar (Dapoli Co-Founder)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Connect directly on WhatsApp with our Dapoli native co-founder Prachii Pawar (+91 74475 68595) for room availability, road guidance, authentic seafood thali requests, or group bookings.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat with Prachii Pawar</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE STICKY BOTTOM BAR (Reserve Stay & WhatsApp)       */}
      {/* ========================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-2xl flex items-center justify-between pb-safe">
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
            Direct Host Rate · 0% Fee
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-konkan-teal-950">
              {formatINR(hotel.starting_price)}
            </span>
            <span className="text-xs text-slate-500">/ night</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs"
            aria-label="Direct WhatsApp Concierge"
          >
            <Phone className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => {
              const widget = document.getElementById("booking-widget");
              if (widget) {
                widget.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-5 py-2.5 rounded-full bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span>Reserve Stay</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
