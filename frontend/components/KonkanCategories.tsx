"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Waves,
  Compass,
  Fish,
  Heart,
  Anchor,
  Trees,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export interface KonkanCategory {
  id: string;
  label: string;
  marathiLabel: string;
  icon: any;
  tagline: string;
  count: number;
  featuredHotelId?: string;
}

export const KONKAN_CATEGORIES: KonkanCategory[] = [
  {
    id: "all",
    label: "All Coastal Stays",
    marathiLabel: "सर्व हॉटेल्स",
    icon: Sparkles,
    tagline: "Explore all verified beachfront resorts, rustic cottages & family homestays",
    count: 6,
  },
  {
    id: "beach_touch",
    label: "Direct Beach-Touch",
    marathiLabel: "थेट समुद्रकिनारी",
    icon: Waves,
    tagline: "Step out directly onto soft sand without crossing roads (< 50m to sea)",
    count: 3,
  },
  {
    id: "dolphin",
    label: "Dolphin Watch",
    marathiLabel: "डॉल्फिन सफारी",
    icon: Compass,
    tagline: "Murud & Karde stays with 6:30 AM sunrise boat safaris and 95% sightings",
    count: 4,
  },
  {
    id: "seafood",
    label: "Gharghuti Seafood",
    marathiLabel: "घरगुती जेवण",
    icon: Fish,
    tagline: "Authentic fresh Surmai, Pomfret fry, Solkadhi & steamed Ukadiche Modak",
    count: 5,
  },
  {
    id: "pet_friendly",
    label: "Pet-Friendly",
    marathiLabel: "पाळीव प्राणी स्वागत",
    icon: Heart,
    tagline: "Spacious private garden cottages where your dogs and pets can play freely",
    count: 2,
  },
  {
    id: "fort_harbor",
    label: "Sea Fort & Harbor",
    marathiLabel: "किल्ला व बंदर",
    icon: Anchor,
    tagline: "Suvarnadurg sea fort view stays and daily 4 PM fresh fish auction walks",
    count: 2,
  },
  {
    id: "wadi",
    label: "Coconut Wadi",
    marathiLabel: "सुपारी नारळी वाडी",
    icon: Trees,
    tagline: "Peaceful retreats inside lush areca-nut and coconut plantations",
    count: 3,
  },
];

interface KonkanCategoriesProps {
  activeCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  showExploreLink?: boolean;
}

export function KonkanCategories({
  activeCategory = "all",
  onSelectCategory,
  showExploreLink = true,
}: KonkanCategoriesProps) {
  const [selected, setSelected] = useState<string>(activeCategory);

  const handleSelect = (id: string) => {
    setSelected(id);
    if (onSelectCategory) {
      onSelectCategory(id);
    }
  };

  const currentCat = KONKAN_CATEGORIES.find((c) => c.id === selected) || KONKAN_CATEGORIES[0];

  return (
    <div className="space-y-4">
      {/* Category Pills Slider */}
      <div className="relative">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
          {KONKAN_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selected === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelect(cat.id)}
                className={`group shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 select-none border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-konkan-teal-400 hover:bg-konkan-teal-50/50 hover:text-konkan-teal-950 shadow-xs"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 group-hover:bg-konkan-teal-100 group-hover:text-konkan-teal-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-konkan-teal-100 group-hover:text-konkan-teal-800"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Spotlight Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-konkan-teal-900 via-slate-900 to-slate-950 text-white p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-konkan-sand-300 shrink-0">
            {(() => {
              const Icon = currentCat.icon;
              return <Icon className="w-5 h-5 text-konkan-sand-300" />;
            })()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm sm:text-base text-white">{currentCat.label}</h4>
              <span className="text-[11px] font-semibold text-konkan-sand-300 hidden sm:inline">
                ({currentCat.marathiLabel})
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{currentCat.tagline}</p>
          </div>
        </div>

        {showExploreLink && (
          <Link
            href="/hotels"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shrink-0 transition-all shadow-sm self-start sm:self-auto"
          >
            <span>Browse {currentCat.count} Stays</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

