"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR, getWhatsAppLink } from "@/lib/utils";
import {
  Waves,
  Ship,
  Compass,
  Fish,
  Bike,
  Car,
  Utensils,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  PhoneCall,
  Calendar,
  ChevronRight,
  Info,
  ArrowRight,
  Anchor
} from "lucide-react";

interface KonkanService {
  id: string;
  category: "boat" | "watersports" | "culture" | "transport";
  title: string;
  tagline: string;
  area: string;
  duration: string;
  priceText: string;
  priceValue?: number;
  badge?: string;
  rating: number;
  reviewsCount: number;
  image: string;
  highlights: string[];
  timing: string;
  description: string;
  operator: string;
  operatorPhone: string;
}

const KONKAN_SERVICES: KonkanService[] = [
  {
    id: "srv-dolphin-safari",
    category: "boat",
    title: "Murud & Karde Morning Dolphin Safari",
    tagline: "Spot playful Indo-Pacific humpback dolphins in the calm Arabian sea",
    area: "Murud Beach & Karde Beach, Dapoli",
    duration: "45 - 60 mins",
    priceText: "₹350 per person",
    priceValue: 350,
    badge: "Most Popular",
    rating: 4.9,
    reviewsCount: 342,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    highlights: [
      "95% Dolphin sighting rate between 7:00 AM - 9:30 AM",
      "Government-inspected motorboats with life jackets",
      "Experienced local Koli fishermen pilots",
      "Stunning panoramic view of the Konkan coastline from the sea"
    ],
    timing: "Daily: 7:00 AM – 10:00 AM (Subject to sea tide)",
    description: "An unforgettable coastal ritual in Dapoli. Small motorized boats venture 1-2 km offshore from Murud or Karde beach into the feeding grounds of resident dolphin pods.",
    operator: "Murud Fishermen Marine Cooperative",
    operatorPhone: "919422388200"
  },
  {
    id: "srv-suvarnadurg-boat",
    category: "boat",
    title: "Suvarnadurg Sea Fort Island Boat Expedition",
    tagline: "Sail across the waves to Chhatrapati Shivaji Maharaj's historic island fortress",
    area: "Harnai Port / Bunder",
    duration: "2 hours",
    priceText: "₹400 per person",
    priceValue: 400,
    badge: "Heritage Gem",
    rating: 4.8,
    reviewsCount: 198,
    image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80",
    highlights: [
      "Island landing right beside the ancient marine water gate",
      "Explore rock-cut cisterns, battlements & defensive bastions",
      "Views across Kanakdurg, Fattehgad and Goa Fort bastions",
      "Guided historical narration from Harnai locals"
    ],
    timing: "Daily: 8:00 AM – 4:30 PM (Low & Mid tide only)",
    description: "Built on an 8-acre rocky islet just 1 km off Harnai Bunder, Suvarnadurg (The Golden Fort) defended the Maratha Navy. Board traditional harbor boats from Harnai beach for a historic sea voyage.",
    operator: "Harnai Bunder Heritage Boats",
    operatorPhone: "919823411001"
  },
  {
    id: "srv-water-sports-ladghar",
    category: "watersports",
    title: "Ladghar Beach Water Sports Combo",
    tagline: "Banana ride, bumper tube, speed boat & jet ski on the red pebble bay",
    area: "Ladghar Beach (Tamas Tirtha)",
    duration: "30 - 45 mins",
    priceText: "₹800 combo per person",
    priceValue: 800,
    badge: "Thrill Seekers",
    rating: 4.7,
    reviewsCount: 220,
    image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    highlights: [
      "Includes 4 activities: Jet Ski, Banana Tube, Bumper Ride & Speedboat",
      "Certified water sports instructors with safety harness",
      "High-speed action on the scenic Ladghar shoreline",
      "Waterproof GoPro video capture available on request"
    ],
    timing: "Daily: 9:00 AM – 6:00 PM (Weather permitting)",
    description: "Ladghar is famous for its crimson sunset water and thrilling beach activities. Enjoy high-speed waves with top safety equipment and local sea pilots.",
    operator: "Ladghar Watersports Adventure Club",
    operatorPhone: "919422388200"
  },
  {
    id: "srv-harnai-fish-auction",
    category: "culture",
    title: "Harnai Beach Evening Fish Auction & Harbor Walk",
    tagline: "Experience one of Maharashtra's largest open-beach coastal fish markets",
    area: "Harnai Bunder / Port Beach",
    duration: "1.5 hours",
    priceText: "Free (Local Experience)",
    badge: "Authentic Culture",
    rating: 4.9,
    reviewsCount: 512,
    image: "https://images.unsplash.com/photo-1534943441045-1c3e1e2d03b0?auto=format&fit=crop&w=800&q=80",
    highlights: [
      "Witness over 100 colorful fishing trawlers returning with the evening tide",
      "Lively high-energy open beach auction of Surmai, Pomfret, King Prawns, and Crabs",
      "Purchase ocean-fresh seafood directly from fisherwomen at wholesale rates",
      "Resort partner kitchens can cook your purchased fish for dinner"
    ],
    timing: "Daily: 4:00 PM – 6:30 PM (Prompt timing recommended)",
    description: "Every evening at 4 PM, Harnai beach comes alive as the harbor fishing fleet returns. The beach turns into an electric open-air market where baskets of fresh catch are auctioned on the sand.",
    operator: "Harnai Koli Fisherfolk Community",
    operatorPhone: "919422388200"
  },
  {
    id: "srv-agro-tourism-modak",
    category: "culture",
    title: "Konkan Agro Farm Tour & Ukadiche Modak Workshop",
    tagline: "Stroll through organic betel nut (wadi) plantations and learn modak making",
    area: "Dapoli Rural / Kelshi Road",
    duration: "2.5 hours",
    priceText: "₹450 per person",
    badge: "Agro Tourism",
    rating: 4.9,
    reviewsCount: 164,
    image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=800&q=80",
    highlights: [
      "Authentic Konkani orchard walk (Supari, Cashew, Kokum, Jackfruit)",
      "Traditional Ukadiche Modak making live demonstration & tasting",
      "Direct orchard-gate purchase of pure Kokum syrup, Aam Papad & Pickles",
      "Cold fresh coconut water and kokum sherbet welcome drink"
    ],
    timing: "Morning: 9:30 AM | Afternoon: 3:30 PM",
    description: "Explore the agricultural bounty that makes Ratnagiri and Dapoli legendary. Stroll through fragrant orchards, learn traditional organic farming, and taste freshly steamed jaggery-coconut modaks.",
    operator: "Kelshi Organic Agro Farmers",
    operatorPhone: "919422388200"
  },
  {
    id: "srv-bike-cab-rentals",
    category: "transport",
    title: "Dapoli Two-Wheeler (Activa) & Private Konkan Cab Rentals",
    tagline: "Explore hidden sea coves, temples, and lighthouses at your own leisurely pace",
    area: "Dapoli Bus Stand / Khed Railway Station / Hotel Delivery",
    duration: "Flexible (24h or Daily)",
    priceText: "From ₹500/day (Scooter)",
    priceValue: 500,
    badge: "Essential Service",
    rating: 4.8,
    reviewsCount: 410,
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    highlights: [
      "Well-maintained Honda Activa & Access scooters with ISI helmets",
      "AC Sedans & Ertigas with local drivers for coastal sightseeing",
      "Convenient pickup & drop at Khed Railway Station or your resort",
      "Complimentary Dapoli beach route map with hidden spots"
    ],
    timing: "Available 24/7 with advance booking",
    description: "The coastal road between Murud, Karde, Ladghar, and Harnai is one of the most scenic drives in Maharashtra. Rent a scooter for effortless beach hopping or book a reliable cab for family sightseeing.",
    operator: "Konkan Wheels & Cab Network",
    operatorPhone: "919422388200"
  }
];

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredServices = selectedCategory === "all"
    ? KONKAN_SERVICES
    : KONKAN_SERVICES.filter((s) => s.category === selectedCategory);

  const buildServiceWhatsAppLink = (service: KonkanService) => {
    const text = `*🌿 Konkan Experience Inquiry — bhramo.com*
--------------------------------
*Service:* ${service.title}
*Location:* ${service.area}
*Approx Price:* ${service.priceText}
*Operator:* ${service.operator}
--------------------------------
Hello! I would like to check availability and book this experience during my stay in Dapoli/Harnai. Please share available slots.`;
    return getWhatsAppLink(service.operatorPhone, text);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-24 text-slate-900">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-slate-950 via-konkan-teal-950 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold tracking-wide shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Curated Dapoli & Harnai Coastal Experiences</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Beyond the Stay: <br />
            <span className="bg-gradient-to-r from-white via-slate-100 to-konkan-teal-200 bg-clip-text text-transparent">
              Konkan Coastal Adventures
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Dolphin safaris at sunrise, island fort boat rides, lively beach fish auctions, and authentic Alphonso wadi walks — curated with trusted local fishermen and verified hosts.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-konkan-teal-200 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Local Community Run
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Direct WhatsApp Booking
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.8+ Rated by Travelers
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-white p-2.5 rounded-full border border-slate-200 shadow-sm max-w-2xl mx-auto">
          {[
            { id: "all", label: "All Experiences" },
            { id: "boat", label: "⛵ Boat Rides & Forts" },
            { id: "watersports", label: "🏄 Water Sports & Jet Ski" },
            { id: "culture", label: "🥥 Agro & Fish Auctions" },
            { id: "transport", label: "🛵 Bike & Cab Rentals" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-slate-950 text-white shadow-md scale-105"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const waLink = buildServiceWhatsAppLink(service);

            return (
              <div
                key={service.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Image & Badge */}
                <div className="relative aspect-[16/10] w-full bg-slate-950 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {service.badge && (
                    <span className="absolute top-3.5 left-3.5 bg-amber-400 text-amber-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                      {service.badge}
                    </span>
                  )}

                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {service.rating} ({service.reviewsCount})
                    </span>
                    <span className="bg-black/60 backdrop-blur-md px-3 py-0.5 rounded-full text-[11px] font-bold border border-white/20">
                      {service.duration}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-konkan-teal-700 font-bold">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{service.area}</span>
                    </div>

                    <h2 className="text-lg font-black text-slate-900 group-hover:text-konkan-teal-800 transition-colors">
                      {service.title}
                    </h2>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Highlights bullets */}
                    <div className="pt-2 space-y-1.5 border-t border-slate-100">
                      {service.highlights.slice(0, 3).map((hl, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{service.timing}</span>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Estimated Tariff
                      </span>
                      <strong className="text-base font-black text-slate-900">
                        {service.priceText}
                      </strong>
                    </div>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Book on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
