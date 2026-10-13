"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Hotel } from "@/types";
import { formatINR } from "@/lib/utils";

interface LeafletMapProps {
  hotels: Hotel[];
  selectedHotelId?: string;
  onSelectHotel?: (hotel: Hotel) => void;
  center?: [number, number];
  zoom?: number;
}

export default function LeafletMap({
  hotels,
  selectedHotelId,
  onSelectHotel,
  center = [17.77, 73.11], // Dapoli - Harnai coastal coordinates
  zoom = 11,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default marker icon assets in Leaflet when bundled by Webpack/Next.js
    // We create clean, reliable custom HTML circle / pin icons
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        scrollWheelZoom: false,
      });

      // OpenStreetMap Free Tile Layer
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers before re-adding
    const markerLayer = L.layerGroup().addTo(map);

    hotels.forEach((hotel) => {
      const isSelected = hotel.id === selectedHotelId;

      // Custom Coastal Teal HTML Marker
      const customIcon = L.divIcon({
        className: "custom-leaflet-pin",
        html: `
          <div style="
            background-color: ${isSelected ? "#0d9488" : "#0f766e"};
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 9999px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            border: 2px solid #ffffff;
            white-space: nowrap;
            cursor: pointer;
            transform: scale(${isSelected ? "1.15" : "1"});
            transition: transform 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          ">
            <span>₹${hotel.pricePerNight}</span>
          </div>
        `,
        iconSize: [60, 26],
        iconAnchor: [30, 13],
      });

      const marker = L.marker([hotel.coordinates.lat, hotel.coordinates.lng], {
        icon: customIcon,
      }).addTo(markerLayer);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 2px; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #134e4a;">${hotel.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">📍 ${hotel.location} · ${hotel.beachDistance}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <span style="font-weight: 700; color: #0f766e; font-size: 12px;">₹${hotel.pricePerNight}/night</span>
            <a href="/hotels/${hotel.id}" style="color: #0284c7; text-decoration: underline; font-size: 11px; font-weight: 600;">View Hotel &rarr;</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        if (onSelectHotel) onSelectHotel(hotel);
      });
    });

    return () => {
      markerLayer.clearLayers();
    };
  }, [hotels, selectedHotelId, center, zoom, onSelectHotel]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[350px] rounded-xl overflow-hidden shadow-inner border border-konkan-sand-300 relative z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
}
