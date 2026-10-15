"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HotelWithDetails } from "@/lib/hotels-service";
import { HotelCard } from "@/components/HotelCard";
import {
  MapPin,
  Star,
  SlidersHorizontal,
  RotateCcw,
  Wind,
  Check,
  ArrowRight,
  Search,
  Sparkles,
  Compass,
  Filter
} from "lucide-react";

interface HotelsExplorerProps {
  initialHotels: HotelWithDetails[];
}

const COMMON_AMENITIES = [
  "Beach Access (150m)",
  "AC Rooms",
  "Konkani Ukadiche Modak",
  "Fresh Malvani Seafood",
  "Free Wi-Fi",
  "Power Backup",
  "Free Parking",
];

const QUICK_CHIPS = [
  { id: "all", label: "All Properties" },
  { id: "beachfront", label: "🏖️ Beachfront (<150m)" },
  { id: "ac", label: "❄️ AC Rooms" },
  { id: "modak", label: "🥥 Ukadiche Modak" },
  { id: "seafood", label: "🐟 Fresh Malvani Dining" },
];

export function HotelsExplorer({ initialHotels }: HotelsExplorerProps) {
  const searchParams = useSearchParams();
  const initialArea = searchParams.get("area") || "all";

  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [acFilter, setAcFilter] = useState<"all" | "ac" | "non_ac">("all");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeChip, setActiveChip] = useState<string>("all");

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleQuickChip = (chipId: string) => {
    setActiveChip(chipId);
    if (chipId === "all") {
      setAcFilter("all");
      setSelectedAmenities([]);
    } else if (chipId === "beachfront") {
      setSelectedAmenities(["Beach Access (150m)"]);
    } else if (chipId === "ac") {
      setAcFilter("ac");
    } else if (chipId === "modak") {
      setSelectedAmenities(["Konkani Ukadiche Modak"]);
    } else if (chipId === "seafood") {
      setSelectedAmenities(["Fresh Malvani Seafood"]);
    }
  };

  const resetFilters = () => {
    setSelectedArea("all");
    setAcFilter("all");
    setMaxPrice(5000);
    setSelectedAmenities([]);
    setSearchQuery("");
    setActiveChip("all");
  };

  const filteredHotels = useMemo(() => {
    return initialHotels.filter((hotel) => {
      // Area filter
      if (selectedArea !== "all" && hotel.area.toLowerCase() !== selectedArea.toLowerCase()) {
        return false;
      }

      // AC / Non-AC filter
      if (acFilter === "ac" && !hotel.has_ac) {
        return false;
      }
      if (acFilter === "non_ac" && !hotel.has_non_ac) {
        return false;
      }

      // Price filter
      if (hotel.starting_price > maxPrice) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = hotel.name.toLowerCase().includes(query);
        const matchesDesc = hotel.description?.toLowerCase().includes(query) ?? false;
        const matchesAddress = hotel.address.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesAddress) return false;
      }

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every((amenity) =>
          hotel.amenities.some((a) => a.toLowerCase().includes(amenity.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });
  }, [initialHotels, selectedArea, acFilter, maxPrice, selectedAmenities, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Title & Quick Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            Konkan Coastal Directory
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Hotels & Homestays in Dapoli & Harnai
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {filteredHotels.length} of {initialHotels.length} verified stays with direct host verification
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search hotel, beach, landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-konkan-teal-600 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Quick Filter Pill Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Curated:</span>
        </span>
        {QUICK_CHIPS.map((chip) => {
          const isActive = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleQuickChip(chip.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all shadow-xs ${
                isActive
                  ? "bg-slate-950 text-white shadow-md scale-105"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-konkan-teal-400 hover:bg-slate-50"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ========================================================= */}
        {/* FILTERS SIDEBAR */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-konkan-teal-700" />
                <span>Filter Stays</span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-konkan-teal-700 hover:text-konkan-teal-900 font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* 1. Area Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Location / Area
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {["all", "Dapoli", "Harnai"].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setSelectedArea(loc)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-xl capitalize transition-all ${
                      selectedArea.toLowerCase() === loc.toLowerCase()
                        ? "bg-konkan-teal-700 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {loc === "all" ? "All" : loc}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. AC / Non-AC Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-konkan-teal-600" />
                <span>AC / Non-AC</span>
              </label>
              <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="acFilter"
                    checked={acFilter === "all"}
                    onChange={() => setAcFilter("all")}
                    className="accent-konkan-teal-700"
                  />
                  <span>All Room Types</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="acFilter"
                    checked={acFilter === "ac"}
                    onChange={() => setAcFilter("ac")}
                    className="accent-konkan-teal-700"
                  />
                  <span>AC Rooms Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="acFilter"
                    checked={acFilter === "non_ac"}
                    onChange={() => setAcFilter("non_ac")}
                    className="accent-konkan-teal-700"
                  />
                  <span>Non-AC / Eco Cottages</span>
                </label>
              </div>
            </div>

            {/* 3. Price Range Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wider">
                  Max Price / Night
                </label>
                <span className="font-black text-konkan-teal-800 bg-konkan-teal-50 px-2.5 py-0.5 rounded-full border border-konkan-teal-200">
                  ₹{maxPrice}
                </span>
              </div>
              <input
                type="range"
                min="1500"
                max="5000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-konkan-teal-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>₹1,500</span>
                <span>₹5,000+</span>
              </div>
            </div>

            {/* 4. Amenities Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Amenities
              </label>
              <div className="space-y-2 text-xs text-slate-700 font-medium">
                {COMMON_AMENITIES.map((amenity) => {
                  const checked = selectedAmenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer select-none p-1 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded accent-konkan-teal-700 w-4 h-4"
                      />
                      <span>{amenity}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* HOTELS GRID OR EMPTY STATE */}
        {/* ========================================================= */}
        <div className="lg:col-span-3">
          {filteredHotels.length === 0 ? (
            /* EMPTY STATE */
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-konkan-teal-700 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Hotels Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                We couldn&apos;t find any hotels matching your current filter criteria in {selectedArea === "all" ? "Dapoli or Harnai" : selectedArea}.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-konkan-teal-700 text-white text-xs font-bold hover:bg-konkan-teal-800 transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            /* GRID OF ENHANCED HOTEL CARDS WITH HOVER PHOTO SWITCHER */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
