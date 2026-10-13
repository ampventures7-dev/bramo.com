import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fetchAllHotels } from "@/lib/hotels-service";
import { HotelCard } from "@/components/HotelCard";
import { formatINR } from "@/lib/utils";
import {
  Waves,
  MapPin,
  Compass,
  ArrowRight,
  ShieldCheck,
  Star,
  Sunset,
  Fish,
  Anchor,
  HelpCircle,
  Sparkles,
  CalendarCheck
} from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Hotels in Dapoli — Beach Resorts, Cottages & Homestays from ₹1,900",
  description:
    "Find and book verified beachfront resorts, rustic laterite cottages, and authentic homestays in Dapoli, Maharashtra. Direct booking for Murud, Ladghar, and Karde beaches with 0% extra fees.",
  keywords: [
    "Hotels in Dapoli",
    "Dapoli beach resorts",
    "Murud beach hotels Dapoli",
    "Ladghar beach cottages",
    "Karde beach resort",
    "Dapoli homestays",
    "Budget hotels in Dapoli",
    "Dapoli Konkan tourism",
  ],
  alternates: {
    canonical: "https://bhramo.com/hotels/dapoli",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bhramo.com/hotels/dapoli",
    title: "Hotels in Dapoli — Beach Resorts & Homestays | bhramo.com",
    description:
      "Handpicked beachfront resorts and authentic Konkani cottages across Murud, Ladghar, and Karde in Dapoli, Maharashtra.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "Hotels and Beach Resorts in Dapoli, Maharashtra",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotels in Dapoli — Beach Resorts & Homestays",
    description:
      "Handpicked beachfront resorts and authentic Konkani cottages across Dapoli.",
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&h=630&q=80",
    ],
  },
};

const DAPOLI_FAQS = [
  {
    q: "Which are the most popular beaches to stay near in Dapoli?",
    a: "Murud Beach (famous for water sports and morning dolphin safaris), Ladghar Beach (renowned for its unique red-tinted sand and Tamas Tirtha sunsets), and Karde Beach (ideal for quiet, scenic laterite cottage holidays) are the top 3 choices.",
  },
  {
    q: "How far is Dapoli from Mumbai and Pune?",
    a: "Dapoli is approximately 215 km from Mumbai (about 5 to 5.5 hours via NH 66 Mumbai-Goa Highway) and roughly 185 km from Pune (about 4.5 hours via Bhor Ghat or Tamhini Ghat).",
  },
  {
    q: "What is the nearest railway station to Dapoli?",
    a: "Khed Railway Station (KHED) on the Konkan Railway network is the closest railhead, situated just 28 km (40 minutes) from Dapoli town center with regular state buses and private cabs.",
  },
  {
    q: "When can we spot dolphins in Dapoli?",
    a: "Dolphin watching boat safaris operate every morning from 7:00 AM to 10:00 AM off Murud and Karde beaches between October and May when sea waters are calm.",
  },
];

export default async function DapoliLandingPage() {
  const allHotels = await fetchAllHotels();
  const dapoliHotels = allHotels.filter((h) => h.area === "Dapoli");

  // Schema.org CollectionPage & FAQPage JSON-LD
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://bhramo.com/hotels/dapoli#webpage",
        "name": "Hotels in Dapoli — Beach Resorts & Homestays",
        "description": "Curated list of verified beachfront resorts and cottages in Dapoli, Maharashtra.",
        "url": "https://bhramo.com/hotels/dapoli",
        "isPartOf": {
          "@type": "WebSite",
          "name": "bhramo.com",
          "url": "https://bhramo.com",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://bhramo.com/hotels/dapoli#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://bhramo.com",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Hotels",
            "item": "https://bhramo.com/hotels",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Hotels in Dapoli",
            "item": "https://bhramo.com/hotels/dapoli",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://bhramo.com/hotels/dapoli#faq",
        "mainEntity": DAPOLI_FAQS.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />

      <div className="space-y-12 pb-16">
        {/* HERO BANNER FOR DAPOLI */}
        <section className="relative bg-gradient-to-b from-konkan-teal-950 via-konkan-teal-900 to-konkan-teal-950 text-white pt-12 pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Breadcrumb Bar */}
            <nav className="flex items-center gap-2 text-xs text-konkan-teal-300">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/hotels" className="hover:text-white transition-colors">Hotels</Link>
              <span>/</span>
              <span className="text-white font-bold">Dapoli</span>
            </nav>

            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-konkan-teal-800/80 border border-konkan-teal-500/40 text-xs font-bold text-konkan-teal-200">
                <Waves className="w-3.5 h-3.5 text-konkan-teal-300" />
                <span>Maharashtra&apos;s Mini Mahabaleshwar by the Sea</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Hotels in Dapoli
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Discover serene beachfront resorts, sea-facing coconut wadi cottages, and traditional red stone (chira) stays across Murud, Ladghar, and Karde beaches. Direct owner confirmation with 0% extra gateway fees.
              </p>
            </div>

            {/* Quick Beach Anchor Pills */}
            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/10 text-konkan-teal-200 font-semibold border border-white/10">
                ● Murud Beach (Water Sports)
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-konkan-teal-200 font-semibold border border-white/10">
                ● Ladghar (Tamas Tirtha Sunset)
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-konkan-teal-200 font-semibold border border-white/10">
                ● Karde Beach (Dolphin Watching)
              </span>
            </div>
          </div>
        </section>

        {/* LISTINGS SECTION */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-konkan-sand-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Verified Stays in Dapoli ({dapoliHotels.length} Available)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All properties personally verified for cleanliness, genuine beach proximity, and authentic Konkani hospitality.
              </p>
            </div>

            <Link
              href="/hotels"
              className="text-xs font-bold text-konkan-teal-700 hover:text-konkan-teal-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore All Areas (Including Harnai)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dapoliHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </section>

        {/* TRAVEL GUIDE & HIGHLIGHTS FOR DAPOLI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-7 sm:p-9 border border-konkan-sand-200 shadow-sm space-y-8">
            <div>
              <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
                Konkan Travel Guide
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                Why Plan Your Coastal Vacation in Dapoli?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-konkan-teal-100 text-konkan-teal-800 flex items-center justify-center font-bold">
                  <Sunset className="w-5 h-5 text-konkan-teal-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Pristine Untouched Beaches</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unlike crowded commercial beaches, Dapoli features uninterrupted shorelines flanked by swaying betel nut orchards, golden sands, and vibrant dolphin sightings.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Fish className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Authentic Konkani Cuisine</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Savor hot steamed Ukadiche Modak prepared with freshly grated coconut and jaggery, pungent pink Sol Kadhi, and daily catch Surmai or Pomfret fry.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">0% Gateway Markup</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Book directly through bhramo.com with direct UPI audit and pay the remaining balance right at the hotel desk upon arrival.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
              Visitor Information
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Frequently Asked Questions About Dapoli Stays
            </h2>
          </div>

          <div className="space-y-3">
            {DAPOLI_FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-konkan-sand-200 space-y-2 shadow-sm"
              >
                <div className="flex items-start gap-2.5 font-bold text-slate-900 text-sm">
                  <HelpCircle className="w-4 h-4 text-konkan-teal-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
