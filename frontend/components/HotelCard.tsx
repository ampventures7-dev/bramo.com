"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Hotel } from "@/types";
import { HotelWithDetails } from "@/lib/hotels-service";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import {
  MapPin,
  Star,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface HotelCardProps {
  hotel: Hotel | HotelWithDetails;
}

function toHotel(h: Hotel | HotelWithDetails): Hotel {
  if ("slug" in h) return h;
  return {
    id: h.id,
    name: h.name,
    slug: h.id,
    location: h.area,
    beachDistance: h.address,
    description: h.description || "",
    pricePerNight: h.starting_price,
    rating: h.average_rating,
    reviewCount: h.review_count,
    images: h.images,
    amenities: h.amenities,
    coordinates: { lat: Number(h.lat), lng: Number(h.lng) },
    contactPhone: h.whatsapp_number || "919422388200",
    whatsappNumber: h.whatsapp_number || "919422388200",
    upiId: "bhramo@upi",
    paymentOptions: ["pay_at_hotel", "upi_qr"],
    address: h.address,
    featured: true,
  };
}

export function HotelCard({ hotel: rawHotel }: HotelCardProps) {
  const hotel = toHotel(rawHotel);
  const router = useRouter();

  // Interactive in-card photo preview carousel
  const [photoIndex, setPhotoIndex] = useState(0);
  const images = hotel.images && hotel.images.length > 0 ? hotel.images : ["/hero/hero-1.jpg"];

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % images.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const quickWaMsg = `Hi, I am inquiring about room availability at *${hotel.name}* in ${hotel.location} via bhramo.com.`;
  const waLink = getWhatsAppLink(hotel.whatsappNumber, quickWaMsg);

  return (
    <div
      onClick={() => router.push(`/hotels/${hotel.slug}`)}
      className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-2xl hover:border-konkan-teal-400/80 transition-all duration-300 flex flex-col group cursor-pointer relative"
    >
      {/* 1. PHOTO DISPLAY WITH MULTI-IMAGE CAROUSEL ON HOVER */}
      <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden select-none">
        <Image
          src={images[photoIndex]}
          alt={hotel.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 backdrop-blur-md text-white shadow-sm border border-white/20">
            {hotel.location}
          </span>
          {hotel.featured && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-white" />
              <span>Beachfront</span>
            </span>
          )}
        </div>

        {/* Rating Pill */}
        <div className="absolute bottom-3.5 right-3.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1 z-10 shadow-md">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{hotel.rating}</span>
          <span className="text-slate-300">({hotel.reviewCount})</span>
        </div>

        {/* In-Card Next/Prev Carousel Controls (Visible on hover if >1 image) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevPhoto}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Photo Dots */}
            <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1 z-10">
              {images.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                  aria-label={`Switch to photo ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. CARD BODY & METADATA */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Location & Beach Proximity */}
          <div className="flex items-center gap-1.5 text-xs text-konkan-teal-700 font-semibold">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{hotel.beachDistance}</span>
          </div>

          {/* Hotel Name */}
          <h3 className="font-black text-lg text-slate-900 group-hover:text-konkan-teal-800 transition-colors line-clamp-1">
            {hotel.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {hotel.description}
          </p>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {hotel.amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full"
              >
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="text-[10px] text-slate-400 font-semibold px-1 py-1">
                +{hotel.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* 3. PRICING & QUICK ACTIONS */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Starting from
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900">
                  {formatINR(hotel.pricePerNight)}
                </span>
                <span className="text-xs text-slate-500">/ night</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>0% Extra Fee</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 text-xs font-bold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            <span className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-full bg-konkan-teal-700 group-hover:bg-konkan-teal-800 text-white text-xs font-bold transition-colors shadow-sm">
              <span>View Rooms</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
