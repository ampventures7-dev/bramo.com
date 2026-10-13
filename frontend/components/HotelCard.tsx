"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Hotel } from "@/types";
import { HotelWithDetails } from "@/lib/hotels-service";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import { BookingModal } from "@/components/BookingModal";
import { MapPin, Star, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";

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
  const [bookingOpen, setBookingOpen] = useState(false);

  const quickWaMsg = `Hi, I am interested in inquiring about room availability at *${hotel.name}* in ${hotel.location}.`;
  const waLink = getWhatsAppLink(hotel.whatsappNumber, quickWaMsg);

  return (
    <>
      <div className="bg-white rounded-2xl border border-konkan-sand-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
        {/* Hotel Image with Badges */}
        <Link
          href={`/hotels/${hotel.slug}`}
          className="relative h-48 sm:h-52 w-full bg-slate-100 overflow-hidden block"
        >
          <Image
            src={hotel.images[0]}
            alt={hotel.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-konkan-teal-800 text-white shadow-sm">
              {hotel.location}
            </span>
            {hotel.featured && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-white shadow-sm">
                ★ Beachfront
              </span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[11px] font-medium flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{hotel.rating}</span>
            <span className="text-slate-300">({hotel.reviewCount})</span>
          </div>
        </Link>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-konkan-teal-700 font-medium">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{hotel.beachDistance}</span>
            </div>

            <Link href={`/hotels/${hotel.slug}`} className="block">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-konkan-teal-800 transition-colors line-clamp-1">
                {hotel.name}
              </h3>
            </Link>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {hotel.description}
            </p>

            {/* Amenities Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hotel.amenities.slice(0, 3).map((amenity, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium bg-konkan-sand-100 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 3 && (
                <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5">
                  +{hotel.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Pricing & Actions */}
          <div className="pt-3 border-t border-konkan-sand-200/80 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Starting from</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-konkan-teal-900">
                    {formatINR(hotel.pricePerNight)}
                  </span>
                  <span className="text-xs text-slate-500">/ night</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Pay at Hotel / UPI
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/60 text-xs font-semibold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setBookingOpen(true)}
                className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Book Stay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BookingModal hotel={hotel} isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}
