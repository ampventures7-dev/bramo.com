"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HotelWithDetails } from "@/lib/hotels-service";
import { HotelCard } from "@/components/HotelCard";
import { HotelMapWrapper } from "@/components/HotelMapWrapper";
import { Hotel } from "@/types";
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
  Filter,
  LayoutGrid,
  Map as MapIcon,
  Columns2,
  ArrowUpDown
} from "lucide-react";

type SortOption = "recommended" | "price_asc" | "price_desc" | "rating_desc";
type ViewMode = "grid" | "split" | "map";

function toMapHotel(h: HotelWithDetails): Hotel {
  return {
    id: h.id,
    name: h.name,
    slug: h.id,
    location: h.area,
    beachDistance: h.address,
    description: h.description || "",
    pricePerNight: h.starting_price,
    rating: h.average_rating,
    reviewCount: h.review_count,
    images: h.images,
    amenities: h.amenities,
    coordinates: { lat: Number(h.lat) || 17.77, lng: Number(h.lng) || 73.11 },
    contactPhone: h.whatsapp_number || "917447568595",
    whatsappNumber: h.whatsapp_number || "917447568595",
    upiId: "pawarprachi745-2@okicici",
    paymentOptions: ["pay_at_hotel", "upi_qr"],
    address: h.address,
    featured: true,
  };
}

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
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeChip, setActiveChip] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedMapHotelId, setSelectedMapHotelId] = useState<string | undefined>(undefined);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  const activeFilterCount =
    (selectedArea !== "all" ? 1 : 0) +
    (acFilter !== "all" ? 1 : 0) +
    (maxPrice < 5000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    selectedAmenities.length +
    (searchQuery.trim() ? 1 : 0);

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
    setMinRating(0);
    setSelectedAmenities([]);
    setSearchQuery("");
    setActiveChip("all");
    setSortBy("recommended");
  };

  const filteredHotels = useMemo(() => {
    const filtered = initialHotels.filter((hotel) => {
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

      // Minimum Rating filter
      if (minRating > 0 && Number(hotel.average_rating) < minRating) {
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

    // Sort results (MMT / Agoda style)
    if (sortBy === "price_asc") {
      return [...filtered].sort((a, b) => a.starting_price - b.starting_price);
    }
    if (sortBy === "price_desc") {
      return [...filtered].sort((a, b) => b.starting_price - a.starting_price);
    }
    if (sortBy === "rating_desc") {
      return [...filtered].sort((a, b) => Number(b.average_rating) - Number(a.average_rating));
    }
    return filtered;
  }, [initialHotels, selectedArea, acFilter, maxPrice, minRating, selectedAmenities, searchQuery, sortBy]);

  const mapHotels = useMemo(() => filteredHotels.map(toMapHotel), [filteredHotels]);

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

      {/* MMT / Agoda Style Sort & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:px-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-konkan-teal-700" />
            <span>Sort:</span>
          </span>
          {[
            { id: "recommended", label: "Recommended" },
            { id: "price_asc", label: "Price: Low → High" },
            { id: "price_desc", label: "Price: High → Low" },
            { id: "rating_desc", label: "Top Rated ★" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortBy(opt.id as SortOption)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                sortBy === opt.id
                  ? "bg-konkan-teal-700 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher: Grid | Split Map + List | Map */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-konkan-teal-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "split"
                ? "bg-white text-konkan-teal-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Split Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "map"
                ? "bg-white text-konkan-teal-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Mobile Filter Toggle Bar */}
      <div className="lg:hidden flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs shadow-sm transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isMobileFiltersOpen ? "Hide Filters" : "Filter & Refine"}</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-konkan-teal-900 text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-slate-500 font-medium">
            {filteredHotels.length} {filteredHotels.length === 1 ? "stay" : "stays"}
          </span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-konkan-teal-700 font-bold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* ========================================================= */}
        {/* FILTERS SIDEBAR */}
        {/* ========================================================= */}
        <div className={`${isMobileFiltersOpen ? "block" : "hidden"} lg:block space-y-6`}>
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
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

            {/* 3b. Guest Rating Filter (MMT/Agoda Style) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Guest Rating</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { val: 0, label: "All Ratings" },
                  { val: 4.5, label: "4.5+ Superb" },
                  { val: 4.0, label: "4.0+ Very Good" },
                  { val: 3.5, label: "3.5+ Good" },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => setMinRating(r.val)}
                    className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      minRating === r.val
                        ? "bg-amber-50 border-amber-400 text-amber-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
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

            {/* Mobile Apply Button */}
            <div className="lg:hidden pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-3 rounded-2xl bg-konkan-teal-700 text-white font-bold text-xs shadow-md"
              >
                Show {filteredHotels.length} {filteredHotels.length === 1 ? "Property" : "Properties"}
              </button>
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
          ) : viewMode === "map" ? (
            /* FULL INTERACTIVE MAP VIEW */
            <div className="h-[580px] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white">
              <HotelMapWrapper
                hotels={mapHotels}
                selectedHotelId={selectedMapHotelId}
                onSelectHotel={(h) => setSelectedMapHotelId(h.id)}
              />
            </div>
          ) : viewMode === "split" ? (
            /* AGODA / MMT SPLIT VIEW: LIST + STICKY INTERACTIVE MAP */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    onMouseEnter={() => setSelectedMapHotelId(hotel.id)}
                    className={`rounded-3xl transition-all ${
                      selectedMapHotelId === hotel.id ? "ring-2 ring-konkan-teal-600 shadow-lg" : ""
                    }`}
                  >
                    <HotelCard hotel={hotel} />
                  </div>
                ))}
              </div>
              <div className="xl:col-span-5 sticky top-24 h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white">
                <HotelMapWrapper
                  hotels={mapHotels}
                  selectedHotelId={selectedMapHotelId}
                  onSelectHotel={(h) => setSelectedMapHotelId(h.id)}
                />
              </div>
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
