"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { MapPin, Calendar, Users, Search } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [area, setArea] = useState<string>("all");
  const [checkIn, setCheckIn] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState<string>(format(addDays(new Date(), 2), "yyyy-MM-dd"));
  const [guests, setGuests] = useState<number>(2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (area && area !== "all") params.set("area", area);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests.toString());

    router.push(`/hotels?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white p-3 sm:p-4 rounded-2xl shadow-2xl border border-konkan-sand-200 text-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto"
    >
      {/* Area Selector */}
      <div className="flex flex-col justify-center px-3 py-2 bg-konkan-sand-50/70 rounded-xl border border-konkan-sand-200">
        <label className="text-[10px] font-bold uppercase tracking-wider text-konkan-teal-800 flex items-center gap-1 mb-0.5">
          <MapPin className="w-3 h-3 text-konkan-teal-600" />
          <span>Area / Location</span>
        </label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer"
        >
          <option value="all">All Konkan (Dapoli & Harnai)</option>
          <option value="Dapoli">Dapoli (Murud, Ladghar, Karde)</option>
          <option value="Harnai">Harnai (Fort & Port)</option>
        </select>
      </div>

      {/* Check-In Date */}
      <div className="flex flex-col justify-center px-3 py-2 bg-konkan-sand-50/70 rounded-xl border border-konkan-sand-200">
        <label className="text-[10px] font-bold uppercase tracking-wider text-konkan-teal-800 flex items-center gap-1 mb-0.5">
          <Calendar className="w-3 h-3 text-konkan-teal-600" />
          <span>Check-in Date</span>
        </label>
        <input
          type="date"
          value={checkIn}
          min={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setCheckIn(e.target.value)}
          className="bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer"
        />
      </div>

      {/* Check-Out Date */}
      <div className="flex flex-col justify-center px-3 py-2 bg-konkan-sand-50/70 rounded-xl border border-konkan-sand-200">
        <label className="text-[10px] font-bold uppercase tracking-wider text-konkan-teal-800 flex items-center gap-1 mb-0.5">
          <Calendar className="w-3 h-3 text-konkan-teal-600" />
          <span>Check-out Date</span>
        </label>
        <input
          type="date"
          value={checkOut}
          min={checkIn || format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setCheckOut(e.target.value)}
          className="bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer"
        />
      </div>

      {/* Guests & Submit Button */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex flex-col justify-center px-3 py-2 bg-konkan-sand-50/70 rounded-xl border border-konkan-sand-200">
          <label className="text-[10px] font-bold uppercase tracking-wider text-konkan-teal-800 flex items-center gap-1 mb-0.5">
            <Users className="w-3 h-3 text-konkan-teal-600" />
            <span>Guests</span>
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="bg-transparent text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "Guest" : "Guests"}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="h-full px-5 py-3 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </form>
  );
}
