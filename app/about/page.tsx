import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Waves, Heart, ShieldCheck, MapPin, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Preserving Authentic Konkan Hospitality | bhramo.com",
  description:
    "Learn about bhramo.com: Built to empower local homestay and cottage hosts across Dapoli and Harnai, Maharashtra with 0% gateway commission.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-konkan-sand-200 pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
          <Waves className="w-3.5 h-3.5" />
          <span>Our Coastal Mission</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          About bhramo<span className="text-konkan-teal-600">.com</span>
        </h1>
        <p className="text-sm text-slate-500">
          Connecting travelers directly with genuine coastal Konkan families in Dapoli and Harnai
        </p>
      </div>

      {/* Hero Visual Card */}
      <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden shadow-md border border-konkan-sand-200">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
          alt="Dapoli Coastal Beauty"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 896px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6 sm:p-8">
          <div className="text-white space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-konkan-teal-300">
              Konkan Heritage
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              Pure Sea Breeze, Red Stone Cottages & Homely Modaks
            </h2>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 space-y-6 leading-relaxed bg-white p-7 sm:p-9 rounded-3xl border border-konkan-sand-200 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Why bhramo.com was Created</h2>
          <p>
            Dapoli and Harnai in Ratnagiri district are among Maharashtra&apos;s most breathtaking coastlines. Yet for years, travelers were trapped by impersonal aggregators with hidden surge pricing, hefty gateway fees, and inaccurate photos.
          </p>
          <p>
            Meanwhile, local Konkan hosts who prepare authentic Ukadiche Modak, arrange dawn dolphin watching safaris, and maintain traditional red laterite stone (chira) cottages were paying high commission margins to corporate OTAs.
          </p>
          <p>
            <strong>bhramo.com was founded to bridge this gap.</strong> We offer a clean, mobile-first booking platform designed specifically for the Konkan coastal circuit with direct WhatsApp coordination and zero payment gateway markups.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-konkan-sand-100">
          <div className="p-4 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 text-center space-y-1">
            <div className="text-2xl font-black text-konkan-teal-800">100%</div>
            <div className="font-bold text-xs text-slate-900">Locally Verified</div>
            <p className="text-[11px] text-slate-500">Every listing inspected in Dapoli & Harnai</p>
          </div>

          <div className="p-4 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 text-center space-y-1">
            <div className="text-2xl font-black text-emerald-800">0%</div>
            <div className="font-bold text-xs text-slate-900">Gateway Fees</div>
            <p className="text-[11px] text-slate-500">Direct manual UPI verification</p>
          </div>

          <div className="p-4 rounded-2xl bg-konkan-sand-50/70 border border-konkan-sand-200/60 text-center space-y-1">
            <div className="text-2xl font-black text-amber-800">Direct</div>
            <div className="font-bold text-xs text-slate-900">Host WhatsApp</div>
            <p className="text-[11px] text-slate-500">Immediate travel coordination</p>
          </div>
        </section>
      </div>
    </div>
  );
}
