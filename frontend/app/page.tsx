import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchAllHotels } from "@/lib/hotels-service";
import { HeroSlider } from "@/components/HeroSlider";
import { CoastalAudioToggle } from "@/components/CoastalAudioToggle";
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
  Anchor,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Clock,
  ArrowUpRight
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
  const heroHotel = allHotels[0] || featuredHotels[0];

  const dapoliCount = allHotels.filter((h) => h.area === "Dapoli").length;
  const harnaiCount = allHotels.filter((h) => h.area === "Harnai").length;

  return (
    <div className="space-y-20 pb-24 bg-[#faf8f5] text-slate-900">
      {/* ========================================================= */}
      {/* 1. HERO SLIDESHOW SECTION (Full-Screen Edge-to-Edge)      */}
      {/* (Left completely untouched as requested)                  */}
      {/* ========================================================= */}
      <section className="w-full">
        <HeroSlider />
      </section>

      {/* Ambient Coastal Ocean Waves Sound Toggle */}
      <CoastalAudioToggle />

      {/* ========================================================= */}
      {/* 2. THE SIGNATURE KONKAN BENTO GRID                        */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
              Curated Coastal Living
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              Experience the True Essence of Konkan
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
            Handpicked beachfront sanctuaries, sunrise marine safaris, and pure coastal hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* Tile 1: Large Featured Beachfront Villa (Spans 2 Columns, 2 Rows) */}
          {heroHotel && (
            <Link
              href={`/hotels/${heroHotel.id}`}
              className="md:col-span-2 lg:col-span-2 relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 group flex flex-col justify-between min-h-[360px] sm:min-h-[420px] bg-slate-950 text-white"
            >
              <Image
                src={heroHotel.images[0] || "/hero/hero-1.jpg"}
                alt={heroHotel.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              {/* Top Badges */}
              <div className="relative z-10 p-5 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-950 shadow-md">
                  ★ Editor's Sanctuary Choice
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/50 backdrop-blur-md text-white border border-white/20">
                  {heroHotel.area} Coast
                </span>
              </div>

              {/* Bottom Card Meta */}
              <div className="relative z-10 p-6 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-konkan-teal-200 font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{heroHotel.address}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {heroHotel.name}
                </h3>

                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                  {heroHotel.description}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/20">
                  <div>
                    <span className="text-[11px] text-slate-300">Direct Host Rate</span>
                    <div className="text-xl font-black text-white">
                      {formatINR(heroHotel.starting_price)}
                      <span className="text-xs font-normal text-slate-300"> / night</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-950 font-bold text-xs group-hover:bg-slate-100 transition-colors shadow-md">
                    <span>Reserve Stay</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Tile 2: Live Dolphin Safari Radar */}
          <Link
            href="/services"
            className="rounded-3xl p-6 bg-gradient-to-br from-konkan-teal-900 to-slate-950 text-white shadow-lg border border-konkan-teal-700/40 flex flex-col justify-between group hover:border-konkan-teal-400 transition-all"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300">
                <Fish className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Live Coastal Radar
                </span>
                <h3 className="text-lg font-black text-white">
                  Morning Dolphin Safaris
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Resident Indo-Pacific dolphin pods active daily right off Murud & Karde shores.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Prime Timing:</span>
                <span className="text-emerald-300 font-bold">6:30 AM – 8:30 AM</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Sighting Rate:</span>
                <span className="text-white font-bold">95% Success</span>
              </div>
            </div>
          </Link>

          {/* Tile 3: Authentic Konkan Culinary Heritage */}
          <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-md flex flex-col justify-between hover:shadow-xl transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 font-bold text-lg">
                🥥
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Konkani Flavors
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Ukadiche Modak & Surmai Thali
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Steamed rice-flour dumplings filled with fresh grated coconut & jaggery, accompanied by fresh harbor fish curries.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-konkan-teal-800">
              <span>Authentic Wadi Kitchens</span>
              <span className="text-amber-600">Pure Local</span>
            </div>
          </div>

          {/* Tile 4: 0% Gateway Fee & Verified Direct UPI Guarantee (Spans full on mobile) */}
          <div className="md:col-span-3 lg:col-span-2 rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:shadow-xl transition-all">
            <div className="space-y-2 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Gateway Surcharge Policy</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">
                Direct Host Booking with 0% Middleman Cut
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay directly to certified local Konkani resort hosts via instant UPI QR or Pay at Hotel upon check-in.
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Hidden Fees
                </span>
                <div className="text-2xl font-black text-emerald-600">₹0 Extra</div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Direct Host Verified
              </span>
            </div>
          </div>

          {/* Tile 5: Suvarnadurg Heritage Sea-Fort Ferry */}
          <Link
            href="/services"
            className="md:col-span-3 lg:col-span-2 rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-slate-900 to-konkan-teal-950 text-white shadow-md border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group hover:border-konkan-teal-400 transition-all"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 text-xs font-bold">
                <Anchor className="w-3.5 h-3.5 text-cyan-300" />
                <span>Historic Sea Fortress</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Suvarnadurg Island Fort Ferry
              </h3>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                Take traditional harbor fishing boats across the waves to explore Chhatrapati Shivaji Maharaj's coastal marine fortress in Harnai.
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DESTINATION HUBS: DAPOLI & HARNAI                      */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            Coastal Havens
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
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
            className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200 bg-white flex flex-col sm:flex-row h-auto sm:h-72"
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
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-konkan-teal-700">
                <span>Explore Dapoli Hotels</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Harnai Area Card */}
          <Link
            href="/hotels/harnai"
            className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200 bg-white flex flex-col sm:flex-row h-auto sm:h-72"
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
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-konkan-teal-700">
                <span>Explore Harnai Hotels</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. AI TRIP PLANNER SPOTLIGHT BANNER                       */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-konkan-teal-950 via-slate-950 to-emerald-950 text-white p-7 sm:p-10 shadow-2xl border border-white/10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                <span>AI Coastal Travel Architect</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Not sure what to explore first? Let AI plan your Dapoli & Harnai holiday!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Get an instant hour-by-hour itinerary customized for couples, families, or friend groups—timed with dolphin sunrise boats, 4 PM fish auctions, and direct verified hotel bookings.
              </p>
            </div>

            <Link
              href="/plan-trip"
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl hover:scale-105 active:scale-95 shrink-0"
            >
              <span>Try AI Trip Planner Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. FEATURED HOTELS SECTION                                */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
              Verified Properties
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
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
            <Link
              key={hotel.id}
              href={`/hotels/${hotel.id}`}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-konkan-teal-300 transition-all duration-300 flex flex-col group cursor-pointer"
            >
              {/* Hotel Photo */}
              <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={hotel.images[0]}
                  alt={hotel.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-konkan-teal-800 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                  {hotel.area}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1 shadow-md">
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

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer price & view button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Starting from</span>
                    <div className="text-lg font-black text-konkan-teal-950">
                      {formatINR(hotel.starting_price)}
                      <span className="text-xs font-normal text-slate-500"> / night</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-konkan-teal-700 group-hover:bg-konkan-teal-800 text-white text-xs font-bold transition-all shadow-sm">
                    <span>View Rooms</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. AEO & GEO FAQ SECTION                                  */}
      {/* ========================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
              Traveler Q&A & Local Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Frequently Asked Questions About Dapoli & Harnai
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Everything you need to know about planning your Konkan coastal holiday.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h3 className="font-bold text-sm text-slate-900">
                What are the best beaches to stay near in Dapoli?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The top coastal stretches are <strong>Murud Beach</strong> (famous for watersports and dolphin boat rides), <strong>Ladghar Beach</strong> (known for its distinct red soil and scenic sunsets), <strong>Karde Beach</strong> (a peaceful white-sand stretch), and <strong>Harnai Port Beach</strong> (home to the historic Suvarnadurg Sea Fort).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h3 className="font-bold text-sm text-slate-900">
                How do I reach Dapoli and Harnai from Mumbai or Pune?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dapoli is approximately 215 km from Mumbai via NH66 (Mumbai-Goa Highway) via Mangaon, and 185 km from Pune via Bhor Ghat or Tamhini Ghat. The nearest railway station is <strong>Khed (30 km away)</strong> on the Konkan Railway network.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h3 className="font-bold text-sm text-slate-900">
                When can I spot wild dolphins in Dapoli?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Wild dolphins are most active from <strong>October to May</strong>. Morning boat safaris depart daily from Murud Beach and Karde Beach between <strong>6:30 AM and 9:00 AM</strong>, offering a 95% sighting rate in calm morning waters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h3 className="font-bold text-sm text-slate-900">
                Why book directly on bhramo.com?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                bhramo.com connects you directly with verified local Konkani property owners with <strong>0% extra platform gateway fees</strong>. You get genuine phone & WhatsApp support, accurate distance to beaches, and local authentic hospitality.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
