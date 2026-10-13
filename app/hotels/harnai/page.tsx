import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fetchAllHotels } from "@/lib/hotels-service";
import { HotelCard } from "@/components/HotelCard";
import { formatINR } from "@/lib/utils";
import {
  Anchor,
  Compass,
  ArrowRight,
  ShieldCheck,
  Star,
  Fish,
  Waves,
  HelpCircle,
  Sparkles,
  MapPin
} from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Hotels in Harnai — Beach Resorts & Sea Fort Stays from ₹2,200",
  description:
    "Book verified sea-view hotels and coastal homestays in Harnai, Maharashtra. Direct boat access to Suvarnadurg sea fort, famous evening fish auctions, and pristine beaches with 0% gateway fees.",
  keywords: [
    "Hotels in Harnai",
    "Harnai resort",
    "Suvarnadurg sea fort stay",
    "Harnai port hotels",
    "Harnai beach homestays",
    "Harnai fish market stays",
    "Anjarle beach resort",
    "Konkan coast Harnai",
  ],
  alternates: {
    canonical: "https://bhramo.com/hotels/harnai",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://bhramo.com/hotels/harnai",
    title: "Hotels in Harnai — Sea Fort Stays & Coastal Resorts | bhramo.com",
    description:
      "Handpicked sea-facing hotels and heritage coastal homestays overlooking historic Suvarnadurg sea fort in Harnai, Maharashtra.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "Hotels in Harnai Port and Suvarnadurg Sea Fort, Maharashtra",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotels in Harnai — Sea Fort Stays & Coastal Resorts",
    description:
      "Handpicked sea-facing hotels and heritage coastal homestays in Harnai, Maharashtra.",
    images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&h=630&q=80",
    ],
  },
};

const HARNAI_FAQS = [
  {
    q: "How can visitors visit Suvarnadurg Sea Fort from Harnai?",
    a: "Local motorized country boats operate daily from Harnai Bunder to Suvarnadurg sea fort between 8:00 AM and 4:30 PM (subject to tide conditions). The short 15-minute boat ride takes you directly to the fortified island gateway.",
  },
  {
    q: "When does the famous Harnai Fish Auction take place?",
    a: "The vibrant coastal fish auction takes place daily on the sands of Harnai Beach / Bunder between 4:00 PM and 7:00 PM, when hundreds of traditional trawlers return with fresh catches of Pomfret, Surmai, King Prawns, and Crabs.",
  },
  {
    q: "How far is Harnai from Dapoli town?",
    a: "Harnai is located just 15 km northwest of Dapoli town center (about 25 minutes scenic drive along coconut-lined coastal roads).",
  },
  {
    q: "What other attractions are located near Harnai?",
    a: "The historic Harnai Lighthouse, Kanakdurg and Fattegad land forts, and the famous ancient Kadyavarcha Ganpati temple in neighboring Anjarle (just 6 km across the Harnai creek bridge) are top nearby attractions.",
  },
];

export default async function HarnaiLandingPage() {
  const allHotels = await fetchAllHotels();
  const harnaiHotels = allHotels.filter((h) => h.area === "Harnai");

  // Schema.org CollectionPage & FAQPage JSON-LD
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://bhramo.com/hotels/harnai#webpage",
        "name": "Hotels in Harnai — Beach Resorts & Sea Fort Stays",
        "description": "Curated list of verified sea-facing resorts and homestays in Harnai, Maharashtra.",
        "url": "https://bhramo.com/hotels/harnai",
        "isPartOf": {
          "@type": "WebSite",
          "name": "bhramo.com",
          "url": "https://bhramo.com",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://bhramo.com/hotels/harnai#breadcrumb",
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
            "name": "Hotels in Harnai",
            "item": "https://bhramo.com/hotels/harnai",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://bhramo.com/hotels/harnai#faq",
        "mainEntity": HARNAI_FAQS.map((faq) => ({
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
        {/* HERO BANNER FOR HARNAI */}
        <section className="relative bg-gradient-to-b from-blue-950 via-konkan-teal-950 to-slate-950 text-white pt-12 pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Breadcrumb Bar */}
            <nav className="flex items-center gap-2 text-xs text-konkan-teal-300">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/hotels" className="hover:text-white transition-colors">Hotels</Link>
              <span>/</span>
              <span className="text-white font-bold">Harnai</span>
            </nav>

            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/80 border border-blue-400/40 text-xs font-bold text-blue-200">
                <Anchor className="w-3.5 h-3.5 text-blue-300" />
                <span>Historic Sea Forts & Vibrant Maritime Heritage</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Hotels in Harnai
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Stay right next to the Arabian Sea facing historic Suvarnadurg sea fort and Harnai fishing harbor. Enjoy sea fort boat rides, bustling sunset fish auctions, and freshest Konkani seafood with 0% extra gateway fees.
              </p>
            </div>

            {/* Quick Beach Anchor Pills */}
            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/10 text-konkan-teal-200 font-semibold border border-white/10">
                ● Suvarnadurg Sea Fort (Island Fortress)
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-konkan-teal-200 font-semibold border border-white/10">
                ● Harnai Bunder (Famous 4:30 PM Fish Auction)
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 text-konkan-teal-200 font-semibold border border-white/10">
                ● Harnai Lighthouse & Cliffs
              </span>
            </div>
          </div>
        </section>

        {/* LISTINGS SECTION */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-konkan-sand-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Verified Stays in Harnai ({harnaiHotels.length} Available)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Beachfront hotels and homestays with direct harbor views and authentic Konkani hospitality.
              </p>
            </div>

            <Link
              href="/hotels"
              className="text-xs font-bold text-konkan-teal-700 hover:text-konkan-teal-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore All Areas (Including Dapoli)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {harnaiHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </section>

        {/* TRAVEL GUIDE & HIGHLIGHTS FOR HARNAI */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-7 sm:p-9 border border-konkan-sand-200 shadow-sm space-y-8">
            <div>
              <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
                Port & Fortress Guide
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                The Unique Coastal Allure of Harnai
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Anchor className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Suvarnadurg Island Fort</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  One of the most impressive maritime fortresses of Chhatrapati Shivaji Maharaj, completely encircled by the roaring Arabian Sea and accessible via short fishing boat rides.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Fish className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Famous Evening Fish Auctions</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Watch Maharashtra&apos;s most active beach auction as hundreds of traditional fishing boats haul their day&apos;s harvest directly onto the sandy beach at sunset.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Direct Konkan Host Stays</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Stay with warm Konkani hosts who can organize your boat tickets, arrange private beach seafood barbecues, and guide you to hidden headland trails.
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
              Frequently Asked Questions About Harnai Stays
            </h2>
          </div>

          <div className="space-y-3">
            {HARNAI_FAQS.map((faq, i) => (
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
