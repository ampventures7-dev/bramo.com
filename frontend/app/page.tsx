import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchAllHotels } from "@/lib/hotels-service";
import { HeroSlider } from "@/components/HeroSlider";
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
    canonical: "https://www.bhramo.com",
  },
};

const HOME_FAQS = [
  {
    q: "What are the best beaches to stay near in Dapoli?",
    a: "The top coastal stretches are Murud Beach (famous for watersports and dolphin boat rides), Ladghar Beach (known for its distinct red soil and scenic sunsets), Karde Beach (a peaceful white-sand stretch), and Harnai Port Beach (home to the historic Suvarnadurg Sea Fort).",
  },
  {
    q: "How do I reach Dapoli and Harnai from Mumbai or Pune?",
    a: "Dapoli is approximately 215 km from Mumbai via NH66 (Mumbai-Goa Highway) via Mangaon, and 185 km from Pune via Bhor Ghat or Tamhini Ghat. The nearest railway station is Khed (30 km away) on the Konkan Railway network.",
  },
  {
    q: "When can I spot wild dolphins in Dapoli?",
    a: "Wild dolphins are most active from October to May. Morning boat safaris depart daily from Murud Beach and Karde Beach between 6:30 AM and 9:00 AM, offering a 95% sighting rate in calm morning waters.",
  },
  {
    q: "Why book directly on bhramo.com?",
    a: "bhramo.com connects you directly with verified local Konkani property owners with 0% extra platform gateway fees. You get genuine phone & WhatsApp support, accurate distance to beaches, and local authentic hospitality.",
  },
  {
    q: "Are beach resorts in Dapoli pet-friendly?",
    a: "Several independent homestays and cottages in Palande, Karde, and Ladghar warmly welcome pets with prior notification to the property host.",
  },
  {
    q: "What authentic Konkani dishes should visitors try?",
    a: "Must-try authentic coastal delicacies include fresh Surmai (Kingfish) and Pomfret fry, Tisrya (clams) masala, freshly steamed Ukadiche Modak, Poha-based breakfast, and refreshing Solkadhi.",
  },
];

export default async function HomePage() {
  const allHotels = await fetchAllHotels();
  const featuredHotels = allHotels.slice(0, 3);
  const heroHotel = allHotels[0] || featuredHotels[0];

  const dapoliCount = allHotels.filter((h) => h.area === "Dapoli").length;
  const harnaiCount = allHotels.filter((h) => h.area === "Harnai").length;

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://www.bhramo.com/#webpage",
        "url": "https://www.bhramo.com",
        "name": "bhramo.com — Coastal Hotels, Beach Resorts & Homestays in Dapoli & Harnai",
        "description": "Discover verified beachfront cottages, luxury sea-facing resorts, and rustic Konkani homestays across Murud, Ladghar, Karde and Harnai.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.bhramo.com/#faq",
        "mainEntity": HOME_FAQS.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        })),
      },
      {
        "@type": "HowTo",
        "@id": "https://www.bhramo.com/#howto-book",
        "name": "How to Book a Verified Coastal Stay on bhramo.com",
        "description": "Step-by-step process for booking authentic beach resorts and Konkani cottages in Dapoli & Harnai with 0% extra gateway fees.",
        "totalTime": "PT3M",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Select Your Coastal Destination",
            "text": "Browse verified beachfront properties across Dapoli, Murud, Ladghar, Karde, or Harnai based on real photos and genuine guest reviews.",
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Choose Room & Dates",
            "text": "Pick your travel dates, select from AC or Non-AC cottages, and review the exact distance to the beach.",
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Instant UPI Confirmation",
            "text": "Pay securely using instant UPI QR scan with 0% platform charges, or choose Pay at Hotel with direct WhatsApp owner notification.",
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <div className="space-y-20 pb-24 bg-[#faf8f5] text-slate-900">
      {/* ========================================================= */}
      {/* 1. HERO SLIDESHOW SECTION (Full-Screen Edge-to-Edge)      */}
      {/* (Left completely untouched as requested)                  */}
      {/* ========================================================= */}
      <section className="w-full">
        <HeroSlider />
      </section>

      {/* ========================================================= */}
      {/* 2. AUTHENTIC KONKAN TRAVEL COLLECTIONS                    */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
              Authentic Coastal Collections
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              Curated Stays in Dapoli & Harnai
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
            Handpicked beachfront cottages, peaceful betel-nut wadis, and genuine family homestays.
          </p>
        </div>

        {/* 4 Themed Travel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Direct Beach-Touch Stays */}
          <Link
            href="/hotels"
            className="group relative rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
              <Image
                src="/hotels/appas-beach-resort/beach-touch-sunset-trail.jpg"
                alt="Direct Beach-Touch Cottages in Palande Dapoli"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-konkan-teal-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                &lt; 50m to Waves
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-konkan-teal-700 uppercase tracking-wider block">
                  Palande & Murud
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-konkan-teal-800 transition-colors">
                  Direct Beach-Touch Stays
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Step straight out onto soft sand without crossing roads. Perfect for sunrise strolls and tranquil sunset waves.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-konkan-teal-700">
                <span>View Beach Stays</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Gharghuti Homestays & Seafood */}
          <Link
            href="/hotels"
            className="group relative rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
              <Image
                src="/hotels/isshan-resort/night-courtyard-dining.jpg"
                alt="Gharghuti Konkani Homestays with home-cooked seafood"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                Gharghuti Jevan
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Warm Hospitality
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                  Family Homestays & Food
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Warm host families serving authentic fresh Surmai and Pomfret thalis, Solkadhi, and steamed Ukdiche Modak.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>Explore Homestays</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 3: Betel-Nut Wadi Cottages */}
          <Link
            href="/hotels"
            className="group relative rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
              <Image
                src="/hotels/sachi-sanskruti/courtyard-palm-gardens.jpg"
                alt="Peaceful Cottages in Betel Nut Wadis Dapoli"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-emerald-700 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                Lush Plantation Stays
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Nature & Seclusion
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  Betel-Nut Wadi Retreats
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Surrounded by tall coconut and areca nut palms. Cool natural shade, chirping birds, and tranquil verandahs.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>View Wadi Cottages</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 4: Dolphin Safari & Marine Adventures */}
          <Link
            href="/services"
            className="group relative rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
              <Image
                src="/hero/hero-1.jpg"
                alt="Morning Dolphin Boat Safari Dapoli Murud"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-sky-700 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                6:30 AM Sunrise Boats
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                  Murud & Harnai
                </span>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-800 transition-colors">
                  Dolphin Safaris & Forts
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Spot wild Indo-Pacific dolphins in calm morning waters, then ride traditional ferry boats to historic Suvarnadurg fort.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700">
                <span>View Experiences</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Human Trust & Direct Host Booking Banner */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">0% Booking Surcharge</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Direct host rates. No hidden service charges or middleman platform commission.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-konkan-teal-50 text-konkan-teal-700 flex items-center justify-center shrink-0 border border-konkan-teal-100">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Direct Host WhatsApp</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Coordinate check-in, special food requests, and directions straight with the host family.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Verified Beach Proximity</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Real walking distances to the shore, checked and confirmed with authentic photos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 border border-cyan-100">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Fresh Seafood on Demand</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Hosts arrange fresh daily catch straight from Harnai harbor fish auctions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DESTINATION HUBS: DAPOLI & HARNAI                      */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            Coastal Destinations
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Explore by Coastal Region
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
                src="/hotels/appas-beach-resort/beach-touch-sunset-trail.jpg"
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
                src="/hotels/ishan-laukik/garden-gazebo-beach-trail.jpg"
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
      {/* 4. TRIP PLANNER SPOTLIGHT BANNER                          */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-konkan-teal-950 via-slate-950 to-slate-900 text-white p-7 sm:p-10 shadow-2xl border border-white/10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-konkan-teal-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-konkan-sand-300 border border-white/20 text-xs font-bold">
                <Compass className="w-3.5 h-3.5 text-konkan-sand-300" />
                <span>Custom Itinerary Planner</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Plan Your Perfect Dapoli & Harnai Holiday
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Get an instant hour-by-hour itinerary customized for couples, families, or friend groups—timed with dolphin sunrise boats, 4 PM fish auctions, and direct verified hotel bookings.
              </p>
            </div>

            <Link
              href="/plan-trip"
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-xl hover:scale-105 active:scale-95 shrink-0"
            >
              <span>Plan Your Trip Free</span>
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

        {featuredHotels.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-konkan-teal-50 text-konkan-teal-800 rounded-full flex items-center justify-center mx-auto">
              <Waves className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Real Coastal Properties Coming Soon</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              We are currently onboarding verified beachfront hotels, homestays, and cottages across Dapoli and Harnai. Are you a local resort or homestay owner?
            </p>
            <div className="pt-2">
              <Link
                href="/owner/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-konkan-teal-800 hover:bg-konkan-teal-900 text-white font-bold text-xs shadow-md transition-all"
              >
                <span>List Your Property &rarr;</span>
              </Link>
            </div>
          </div>
        ) : (
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
                    src={hotel.images[0] || "/hero/hero-1.jpg"}
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
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. GEO & AEO COASTAL COMPARISON TABLE (High Citability)   */}
      {/* ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            Konkan Coastline Guide
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Dapoli & Harnai Beach Comparison
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Choose the ideal coastline based on dolphin safaris, water sports, and beach vibe.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 sm:hidden">
          <span>← Swipe horizontally to view full comparison →</span>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm scrollbar-none">
          <table className="w-full min-w-[620px] text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-4 px-5">Beach & Location</th>
                <th className="py-4 px-4">Coastline Vibe</th>
                <th className="py-4 px-4 text-center">Dolphin Safari</th>
                <th className="py-4 px-4 text-center">Water Sports</th>
                <th className="py-4 px-4">Distance from Dapoli</th>
                <th className="py-4 px-5 text-right">Ideal For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900">
                  <span className="text-konkan-teal-800">Murud Beach</span>
                </td>
                <td className="py-3.5 px-4">Gentle slope, energetic, wide shore</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">★ High (95%)</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Available</td>
                <td className="py-3.5 px-4 font-mono text-xs">11 km (20 mins)</td>
                <td className="py-3.5 px-5 text-right font-medium">Families & Water Sports</td>
              </tr>
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900">
                  <span className="text-konkan-teal-800">Ladghar Beach</span>
                </td>
                <td className="py-3.5 px-4">Red tinted sand (Tamas Teertha), sunset views</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Moderate</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Available</td>
                <td className="py-3.5 px-4 font-mono text-xs">12 km (25 mins)</td>
                <td className="py-3.5 px-5 text-right font-medium">Couples & Sunset Chasers</td>
              </tr>
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900">
                  <span className="text-konkan-teal-800">Karde Beach</span>
                </td>
                <td className="py-3.5 px-4">4 km unbroken white-sand shoreline, secluded</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">★ High (90%)</td>
                <td className="py-3.5 px-4 text-center text-amber-600 font-medium">Seasonal</td>
                <td className="py-3.5 px-4 font-mono text-xs">13 km (25 mins)</td>
                <td className="py-3.5 px-5 text-right font-medium">Peace, Nature & Dolphins</td>
              </tr>
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900">
                  <span className="text-konkan-teal-800">Harnai Port & Bunder</span>
                </td>
                <td className="py-3.5 px-4">Historic sea fort Suvarnadurg, busy fish auction</td>
                <td className="py-3.5 px-4 text-center text-slate-400">Low</td>
                <td className="py-3.5 px-4 text-center text-slate-400">Boating to Fort</td>
                <td className="py-3.5 px-4 font-mono text-xs">15 km (25 mins)</td>
                <td className="py-3.5 px-5 text-right font-medium">History, Forts & Seafood</td>
              </tr>
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-5 font-bold text-slate-900">
                  <span className="text-konkan-teal-800">Palande Beach</span>
                </td>
                <td className="py-3.5 px-4">Quiet cove between Murud and Harnai, lush palms</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">Moderate</td>
                <td className="py-3.5 px-4 text-center text-slate-400">No (Quiet)</td>
                <td className="py-3.5 px-4 font-mono text-xs">14 km (22 mins)</td>
                <td className="py-3.5 px-5 text-right font-medium">Beach Touch Homestays</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. AEO & GEO FAQ SECTION (Optimized for AI Overviews)     */}
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
              Direct answers to frequently searched questions about planning your Konkan coastal trip.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {HOME_FAQS.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h3 className="font-bold text-sm text-slate-900">{faq.q}</h3>
                <p className="text-xs text-slate-600 leading-relaxed aeo-faq-answer">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
