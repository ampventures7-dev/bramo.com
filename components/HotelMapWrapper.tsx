"use client";

import dynamic from "next/dynamic";
import { Hotel } from "@/types";

// Dynamically import Leaflet map with SSR disabled
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] rounded-xl bg-konkan-sand-100 flex items-center justify-center border border-konkan-sand-300 text-slate-500 text-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-konkan-teal-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading OpenStreetMap for Dapoli & Harnai...</span>
      </div>
    </div>
  ),
});

interface HotelMapWrapperProps {
  hotels: Hotel[];
  selectedHotelId?: string;
  onSelectHotel?: (hotel: Hotel) => void;
  center?: [number, number];
  zoom?: number;
}

export function HotelMapWrapper(props: HotelMapWrapperProps) {
  return <LeafletMap {...props} />;
}
