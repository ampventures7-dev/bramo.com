"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HotelWithDetails } from "@/lib/hotels-service";
import { formatINR } from "@/lib/utils";
import {
  MapPin,
  Star,
  SlidersHorizontal,
  RotateCcw,
  Wind,
  Check,
  ArrowRight,
  Search,
  Sparkles
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

export function HotelsExplorer({ initialHotels }: HotelsExplorerProps) {
  const searchParams = useSearchParams();
  const initialArea = searchParams.get("area") || "all";

  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [acFilter, setAcFilter] = useState<"all" | "ac" | "non_ac">("all");
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setSelectedArea("all");
    setAcFilter("all");
    setMaxPrice(5000);
    setSelectedAmenities([]);
    setSearchQuery("");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-konkan-sand-200 pb-5">
        <div>
          <span className="text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
            Konkan Coastal Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Hotels & Homestays in Dapoli & Harnai
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {filteredHotels.length} of {initialHotels.length} verified stays
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search hotel, beach, landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-konkan-sand-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-konkan-teal-600 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ========================================================= */}
        {/* FILTERS SIDEBAR */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-konkan-sand-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-konkan-sand-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-konkan-teal-700" />
                <span>Filter Stays</span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-konkan-teal-700 hover:text-konkan-teal-900 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* 1. Area Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Location / Area
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-konkan-sand-50 p-1 rounded-xl border border-konkan-sand-200">
                {["all", "Dapoli", "Harnai"].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setSelectedArea(loc)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg capitalize transition-colors ${
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
              <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-konkan-sand-50">
                  <input
                    type="radio"
                    name="acFilter"
                    checked={acFilter === "all"}
                    onChange={() => setAcFilter("all")}
                    className="accent-konkan-teal-700"
                  />
                  <span>All Room Types</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-konkan-sand-50">
                  <input
                    type="radio"
                    name="acFilter"
                    checked={acFilter === "ac"}
                    onChange={() => setAcFilter("ac")}
                    className="accent-konkan-teal-700"
                  />
                  <span>AC Rooms Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-konkan-sand-50">
                  <input
                    type="radio"
                    name="acFilter"
                    checked={acFilter === "non_ac"}
                    onChange={() => setAcFilter("non_ac")}
                    className="accent-konkan-teal-700"
                  />
                  <span>Non-AC / Eco Chira Cottages</span>
                </label>
              </div>
            </div>

            {/* 3. Price Range Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-800 uppercase tracking-wider">
                  Max Price / Night
                </label>
                <span className="font-bold text-konkan-teal-800 bg-konkan-teal-50 px-2 py-0.5 rounded border border-konkan-teal-200">
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
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹1,500</span>
                <span>₹5,000+</span>
              </div>
            </div>

            {/* 4. Amenities Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Amenities
              </label>
              <div className="space-y-2 text-xs text-slate-700">
                {COMMON_AMENITIES.map((amenity) => {
                  const checked = selectedAmenities.includes(amenity);
                  return (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded accent-konkan-teal-700 w-3.5 h-3.5"
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
            <div className="p-12 text-center bg-white rounded-3xl border border-konkan-sand-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-konkan-sand-100 text-konkan-teal-700 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No Hotels Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                We couldn&apos;t find any hotels matching your current filter criteria in {selectedArea === "all" ? "Dapoli or Harnai" : selectedArea}.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-konkan-teal-700 text-white text-xs font-semibold hover:bg-konkan-teal-800 transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            /* GRID OF HOTEL CARDS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="bg-white rounded-2xl border border-konkan-sand-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Hotel Image with next/image */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
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
                    <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-white text-[11px] font-semibold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{hotel.average_rating}</span>
                      <span className="text-slate-300">({hotel.review_count})</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-[11px] text-konkan-teal-700 font-medium">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{hotel.address}</span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 group-hover:text-konkan-teal-800 transition-colors line-clamp-1">
                        {hotel.name}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {hotel.description}
                      </p>

                      {/* Amenities Pills */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-konkan-sand-100 text-slate-700 font-medium px-2 py-0.5 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Starting price & Details button */}
                    <div className="pt-3 border-t border-konkan-sand-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Starting from</span>
                        <div className="text-base font-bold text-konkan-teal-900">
                          {formatINR(hotel.starting_price)}
                          <span className="text-[11px] font-normal text-slate-500"> / night</span>
                        </div>
                      </div>

                      <Link
                        href={`/hotels/${hotel.id}`}
                        className="inline-flex items-center gap-1 py-2 px-3 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white text-xs font-semibold transition-colors shadow-sm"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
