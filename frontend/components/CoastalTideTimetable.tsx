"use client";

import { useState } from "react";
import {
  Compass,
  Fish,
  Waves,
  Sunset,
  Anchor,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";

export interface CoastalActivity {
  id: string;
  title: string;
  location: string;
  timeWindow: string;
  badge: string;
  badgeColor: string;
  icon: any;
  description: string;
  insiderTip: string;
}

export const COASTAL_TIMETABLE: CoastalActivity[] = [
  {
    id: "dolphin",
    title: "Wild Dolphin Sunrise Boat Safari",
    location: "Murud Beach & Karde Beach",
    timeWindow: "6:30 AM – 9:00 AM",
    badge: "95% Sighting Rate",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
    icon: Compass,
    description:
      "Pods of Indo-Pacific humpback dolphins feed close to the shore in the quiet morning sea before motorboat traffic picks up.",
    insiderTip:
      "Reach Murud or Karde beach by 6:45 AM. Waters are flattest and dolphin activity peaks around early sunrise.",
  },
  {
    id: "fish_auction",
    title: "Famous Harnai Beach Fish Auction",
    location: "Harnai Harbor Beach",
    timeWindow: "4:00 PM – 6:30 PM",
    badge: "Must-Experience",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    icon: Fish,
    description:
      "Over 100 colorful fishing trawlers land directly on the sand. Wholesalers and locals gather for live open-air bidding of fresh catch.",
    insiderTip:
      "Bring cash if buying fresh Pomfret or Surmai. You can bring your fresh catch back to your homestay host to cook for dinner!",
  },
  {
    id: "low_tide_swim",
    title: "Low Tide Beach Walk & Safe Family Swim",
    location: "Ladghar, Karde & Palande Beaches",
    timeWindow: "8:00 AM – 11:30 AM & 3:30 PM – 5:30 PM",
    badge: "Kid-Safe Water",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: Waves,
    description:
      "The Arabian Sea recedes gently over shallow laterite sand bars, creating flat, waist-deep wading zones with zero sudden drop-offs.",
    insiderTip:
      "Always check red flag markers with local fishermen. Palande and Karde offer the gentlest slope for young kids.",
  },
  {
    id: "sunset",
    title: "Tamas Tirtha Sunset Golden Hour",
    location: "Ladghar Beach & Murud Viewpoint",
    timeWindow: "5:45 PM – 6:25 PM",
    badge: "Photographer's Delight",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    icon: Sunset,
    description:
      "The setting sun casts rich red-gold light across the volcanic red pebble sands of Ladghar ('Tamas Tirtha'), turning the sea crimson.",
    insiderTip:
      "Order hot Solkadhi or tender coconut water from local beach shacks 15 minutes before sunset.",
  },
  {
    id: "fort_ferry",
    title: "Suvarnadurg Sea Fort Island Ferry",
    location: "Harnai Port Jetty",
    timeWindow: "8:30 AM – 1:00 PM (High Tide Dependent)",
    badge: "Historical Island Fort",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    icon: Anchor,
    description:
      "Ride traditional wooden motorized ferry boats across the channel to explore the grand island sea fortress of Chhatrapati Shivaji Maharaj.",
    insiderTip:
      "Wear sturdy walking shoes or floaters; the carved stone sea entrance requires walking over damp laterite rocks.",
  },
];

interface CoastalTideTimetableProps {
  conciergePhone?: string;
  hotelArea?: string;
  compact?: boolean;
}

export function CoastalTideTimetable({
  conciergePhone = "917447568595",
  hotelArea,
  compact = false,
}: CoastalTideTimetableProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered =
    activeTab === "all"
      ? COASTAL_TIMETABLE
      : activeTab === "dapoli"
      ? COASTAL_TIMETABLE.filter((item) =>
          item.location.toLowerCase().includes("murud") ||
          item.location.toLowerCase().includes("ladghar") ||
          item.location.toLowerCase().includes("karde") ||
          item.location.toLowerCase().includes("palande")
        )
      : COASTAL_TIMETABLE.filter((item) => item.location.toLowerCase().includes("harnai"));

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-konkan-teal-50 text-konkan-teal-800 text-[11px] font-bold border border-konkan-teal-200 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-konkan-teal-600" />
            <span>Live Coastal Activity & Tide Guide</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            Dapoli & Harnai Daily Coastal Timetable
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Time your beach day with dolphin boat safaris, safe low-tide swimming, and beach fish auctions.
          </p>
        </div>

        {/* Local Concierge Tide Verification Pill */}
        <a
          href={`https://wa.me/${conciergePhone}?text=${encodeURIComponent("Hi Prachii! Can you tell me today's high tide / low tide times and dolphin safari conditions in Dapoli?")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ask Prachii (Dapoli Co-Founder) Today&apos;s Tides</span>
        </a>
      </div>

      {/* Tabs */}
      {!compact && (
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Coastal Activities (5)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dapoli")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "dapoli"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Dapoli Beaches (Murud, Karde, Ladghar)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("harnai")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "harnai"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Harnai Harbor & Sea Fort
          </button>
        </div>
      )}

      {/* Timetable Cards Grid */}
      <div className={`grid grid-cols-1 ${compact ? "gap-3" : "md:grid-cols-2 lg:grid-cols-3 gap-4"}`}>
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 hover:border-konkan-teal-300 hover:bg-white transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <div className="w-7 h-7 rounded-lg bg-konkan-teal-100 text-konkan-teal-800 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold line-clamp-1">{item.title}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-black text-slate-900">
                    <Clock className="w-3 h-3 text-konkan-teal-700" />
                    <span>{item.timeWindow}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>

              {/* Insider Tip Box */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-950">
                <span className="font-bold text-amber-900 block mb-0.5">💡 Local Insider Tip:</span>
                <span>{item.insiderTip}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

