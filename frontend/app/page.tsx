import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchAllHotels } from "@/lib/hotels-service";
import { HomeSearch } from "@/components/HomeSearch";
import { formatINR } from "@/lib/utils";
import {
  Waves,
  MapPin,
  Star,
  ArrowRight,
  ShieldCheck,
  Compass,
  Fish,
  Sunset,
  Anchor
} from "lucide-react";

export const revalidate = 60; // ISR cache for fast delivery

export const metadata: Metadata = {
  title: "bhramo.com — Coastal Hotels, Beach Resorts & Homestays in Dapoli & Harnai",
  description:
    "Discover verified beachfront cottages, luxury sea-facing resorts, and rustic Konkani homestays across Murud, Ladghar, Karde and Harnai. Direct UPI booking with 0% extra gateway fees.",
  alternates: {
    canonical: "https://bhramo.com",
  },
};

export default async function HomePage() {
  const allHotels = await fetchAllHotels();
  const featuredHotels = allHotels.slice(0, 3);

  const dapoliCount = allHotels.filter((h) => h.area === "Dapoli").length;
  const harnaiCount = allHotels.filter((h) => h.area === "Harnai").length;

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION WITH SEARCH */}
      <section className="relative bg-gradient-to-b from-konkan-teal-950 via-konkan-teal-900 to-konkan-teal-950 text-white pt-16 pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Subtle coastal grid background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#99f6e4_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-konkan-teal-800/80 border border-konkan-teal-500/40 text-xs font-semibold text-konkan-teal-200 shadow-sm">
            <Waves className="w-3.5 h-3.5 text-konkan-teal-300" />
            <span>Official Coastal Portal for Dapoli & Harnai, Maharashtra</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            Discover Serene Konkan Stays in <br className="hidden sm:inline" />
            <span className="text-konkan-teal-300 underline decoration-konkan-sand-400 decoration-wavy decoration-2">
              Dapoli & Harnai
            </span>
          </h1>

          <p className="text-sm sm:text-base text-konkan-sand-100 max-w-2xl mx-auto leading-relaxed font-normal">
            Direct owner reservations with zero extra commissions. Enjoy sea-facing cottages, authentic Malvani fish thalis, and golden sunsets.
          </p>

          {/* Interactive Search Component */}
          <div className="pt-4">
            <HomeSearch />
          </div>
        </div>
      </section>

      {/* 2. AREA CARDS FOR DAPOLI & HARNAI */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            Coastal Destinations
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Choose Your Konkan Sanctuary
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Each coastal haven offers unique beaches, rich heritage, and authentic coastal living.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Dapoli Area Card */}
          <Link
            href="/hotels/dapoli"
            className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-konkan-sand-200 bg-white flex flex-col sm:flex-row h-auto sm:h-72"
          >
            <div className="relative w-full sm:w-1/2 h-48 sm:h-full shrink-0 overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
                alt="Dapoli Beaches"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-konkan-teal-800 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                {dapoliCount} Stays Available
              </div>
            </div>
            <div className="p-6 flex flex-col justify-between space-y-4 flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-konkan-teal-700 font-semibold">
                  <Sunset className="w-4 h-4 text-amber-500" />
                  <span>Murud · Ladghar · Karde</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-konkan-teal-800 transition-colors">
                  Dapoli Coastline
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  Known as 'Mini Mahabaleshwar' of Konkan. Famous for Murud water sports, dolphin boat safaris, Ladghar red pebble sunsets, and betel nut wadis.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-konkan-sand-100 text-xs font-bold text-konkan-teal-700">
                <span>Explore Dapoli Hotels</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Harnai Area Card */}
          <Link
            href="/hotels/harnai"
            className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-konkan-sand-200 bg-white flex flex-col sm:flex-row h-auto sm:h-72"
          >
            <div className="relative w-full sm:w-1/2 h-48 sm:h-full shrink-0 overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80"
                alt="Harnai Port & Fort"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-konkan-teal-800 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                {harnaiCount} Stays Available
              </div>
            </div>
            <div className="p-6 flex flex-col justify-between space-y-4 flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-konkan-teal-700 font-semibold">
                  <Anchor className="w-4 h-4 text-sky-600" />
                  <span>Suvarnadurg Sea Fort · Fish Auctions</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-konkan-teal-800 transition-colors">
                  Harnai Harbor & Sea Fort
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  Historic port fortress overlooking the Arabian Sea. Witness famous daily fish auctions right at the beach, cliffside lighthouse walks, and peaceful bays.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-konkan-sand-100 text-xs font-bold text-konkan-teal-700">
                <span>Explore Harnai Hotels</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. FEATURED HOTELS SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-konkan-sand-200 pb-4">
          <div>
            <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
              Verified Properties
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Coastal Hotels
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Top rated beachfront resorts and homestays across Dapoli & Harnai
            </p>
          </div>
          <Link
            href="/hotels"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-konkan-teal-800 hover:text-konkan-teal-950 transition-colors"
          >
            <span>View All {allHotels.length} Hotels</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredHotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-white rounded-2xl border border-konkan-sand-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Hotel Photo */}
              <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={hotel.images[0]}
                  alt={hotel.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-konkan-teal-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  {hotel.area}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-white text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{hotel.average_rating}</span>
                  <span className="text-slate-300">({hotel.review_count})</span>
                </div>
              </div>

              {/* Hotel Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-konkan-teal-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{hotel.address}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-konkan-teal-800 transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {hotel.description}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-konkan-sand-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer price & view button */}
                <div className="pt-3 border-t border-konkan-sand-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500">Starting from</span>
                    <div className="text-lg font-bold text-konkan-teal-900">
                      {formatINR(hotel.starting_price)}
                      <span className="text-xs font-normal text-slate-500"> / night</span>
                    </div>
                  </div>

                  <Link
                    href={`/hotels/${hotel.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    <span>View Rooms</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
