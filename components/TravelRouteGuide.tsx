"use client";

import React, { useState } from "react";
import {
  Car,
  Ship,
  Compass,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Train,
  ArrowRight,
  ExternalLink,
  Sparkles
} from "lucide-react";

export function TravelRouteGuide({ area = "Dapoli" }: { area?: string }) {
  const [activeOrigin, setActiveOrigin] = useState<"mumbai" | "pune">("mumbai");
  const [activeMumbaiMode, setActiveMumbaiMode] = useState<"nh66" | "roro">("nh66");
  const [activePuneMode, setActivePuneMode] = useState<"tamhini" | "bhor">("tamhini");

  return (
    <div className="bg-white rounded-3xl border border-konkan-sand-200 p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-konkan-sand-200 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-konkan-teal-50 text-konkan-teal-800 text-[11px] font-bold">
            <Compass className="w-3.5 h-3.5 text-konkan-teal-700" />
            <span>Konkan Travel Route Planner</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">
            How to Reach {area} from Mumbai & Pune
          </h3>
          <p className="text-xs text-slate-500">
            Real-world driving routes, RORO car ferries, and Konkan Railway connections.
          </p>
        </div>

        {/* Origin Switcher Pills */}
        <div className="flex items-center bg-konkan-sand-100 p-1 rounded-2xl border border-konkan-sand-300 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveOrigin("mumbai")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeOrigin === "mumbai"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>From Mumbai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveOrigin("pune")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeOrigin === "pune"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>From Pune</span>
          </button>
        </div>
      </div>

      {/* MUMBAI ROUTES */}
      {activeOrigin === "mumbai" && (
        <div className="space-y-6">
          {/* Sub-modes: NH66 vs RORO Ferry */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setActiveMumbaiMode("nh66")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMumbaiMode === "nh66"
                  ? "bg-konkan-teal-700 text-white shadow-xs"
                  : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
              }`}
            >
              🚗 Route 1: NH66 Coastal Highway (Direct Road)
            </button>

            <button
              type="button"
              onClick={() => setActiveMumbaiMode("roro")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMumbaiMode === "roro"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-800 hover:bg-blue-100"
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              <span>Route 2: M2M RORO Car Ferry (Scenic)</span>
            </button>
          </div>

          {activeMumbaiMode === "nh66" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-konkan-sand-50 border border-konkan-sand-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Driving Distance</span>
                  <strong className="text-sm font-black text-slate-900">~215 km</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-konkan-sand-50 border border-konkan-sand-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Average Duration</span>
                  <strong className="text-sm font-black text-slate-900">4.5 to 5.5 hours</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-konkan-sand-50 border border-konkan-sand-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Recommended Departure</span>
                  <strong className="text-sm font-black text-slate-900">06:00 AM – 07:00 AM</strong>
                </div>
              </div>

              {/* Waypoints timeline */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block text-xs">Route Milestones:</span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-800">
                  <span>Mumbai</span> &rarr;
                  <span>Panvel</span> &rarr;
                  <span>Pen</span> &rarr;
                  <span>Mangaon (Breakfast Stop)</span> &rarr;
                  <span>Mahad Bypass</span> &rarr;
                  <span>Lonere Phata</span> &rarr;
                  <span className="text-konkan-teal-800 font-bold">Khed / Dapoli Ghat</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  💡 <strong>Tip:</strong> The NH66 four-laning is complete across majority of sections. Stop for piping hot Misal Pav & tea near Mangaon or Vadapav in Pen.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
                  <span className="text-[10px] text-blue-600 font-bold uppercase block">Ferry Cruise Time</span>
                  <strong className="text-sm font-black">60 mins (Drive car onto vessel)</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
                  <span className="text-[10px] text-blue-600 font-bold uppercase block">Mandwa to Dapoli</span>
                  <strong className="text-sm font-black">~135 km (3.5 hrs drive)</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
                  <span className="text-[10px] text-blue-600 font-bold uppercase block">Ferry Terminal</span>
                  <strong className="text-sm font-black">Bhaucha Dhakka (Ferry Wharf)</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs text-slate-700">
                <span className="font-bold text-blue-950 block text-xs">RORO Ferry Milestones:</span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-800">
                  <span>Bhaucha Dhakka Ferry Wharf</span> &rarr;
                  <span className="text-blue-700 font-bold">Mandwa Jetty (RORO)</span> &rarr;
                  <span>Alibaug</span> &rarr;
                  <span>Roha</span> &rarr;
                  <span>Mangaon</span> &rarr;
                  <span className="text-konkan-teal-800 font-bold">Dapoli / Harnai</span>
                </div>
                <p className="text-[11px] text-slate-600 pt-1">
                  🚢 <strong>Why Take Ferry:</strong> Skips heavy morning traffic on Sion-Panvel highway. Enjoy sea breeze and Mumbai harbor views from the ferry deck. Book car slot in advance at m2mferries.com.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PUNE ROUTES */}
      {activeOrigin === "pune" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setActivePuneMode("tamhini")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePuneMode === "tamhini"
                  ? "bg-konkan-teal-700 text-white shadow-xs"
                  : "bg-konkan-sand-100 text-slate-600 hover:bg-konkan-sand-200"
              }`}
            >
              🌿 Route 1: Via Tamhini Ghat & Mulshi (Most Popular)
            </button>

            <button
              type="button"
              onClick={() => setActivePuneMode("bhor")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePuneMode === "bhor"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              ⛰️ Route 2: Via Bhor / Varandha Ghat (Scenic Passes)
            </button>
          </div>

          {activePuneMode === "tamhini" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-konkan-sand-50 border border-konkan-sand-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Driving Distance</span>
                  <strong className="text-sm font-black text-slate-900">~185 km</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-konkan-sand-50 border border-konkan-sand-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Average Duration</span>
                  <strong className="text-sm font-black text-slate-900">4.5 to 5 hours</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-konkan-sand-50 border border-konkan-sand-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Road Condition</span>
                  <strong className="text-sm font-black text-emerald-700">Smooth tarred ghat road</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block text-xs">Tamhini Route Milestones:</span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-800">
                  <span>Pune (Chandani Chowk)</span> &rarr;
                  <span>Pirangut</span> &rarr;
                  <span>Mulshi Dam</span> &rarr;
                  <span className="text-emerald-700 font-bold">Tamhini Ghat</span> &rarr;
                  <span>Nizampur</span> &rarr;
                  <span>Mangaon</span> &rarr;
                  <span>Lonere</span> &rarr;
                  <span className="text-konkan-teal-800 font-bold">Dapoli</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  ☕ <strong>Pitstop Tip:</strong> Enjoy roasted sweet corn (bhutta) and tea overlooking Mulshi lake or Tamhini waterfall viewpoints.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Driving Distance</span>
                  <strong className="text-sm font-black">~195 km</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Average Duration</span>
                  <strong className="text-sm font-black">5.0 to 5.5 hours</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase block">Vibe</span>
                  <strong className="text-sm font-black">Steep cliffside vistas</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs text-slate-700">
                <span className="font-bold text-emerald-950 block text-xs">Varandha Route Milestones:</span>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-800">
                  <span>Pune</span> &rarr;
                  <span>Shirwal (NH48)</span> &rarr;
                  <span>Bhor</span> &rarr;
                  <span className="text-emerald-800 font-bold">Varandha Ghat (Shivthar Ghal)</span> &rarr;
                  <span>Mahad</span> &rarr;
                  <span className="text-konkan-teal-800 font-bold">Latwan / Dapoli</span>
                </div>
                <p className="text-[11px] text-slate-600 pt-1">
                  ⚠️ <strong>Caution:</strong> Varandha Ghat has steep hairpins. Drive cautiously during heavy monsoon rains.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Train & Beach Driving Advice Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-konkan-sand-200 text-xs">
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
            <Train className="w-4 h-4 text-amber-700" />
            <span>Nearest Railway Station: Khed (KHED)</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Khed is on the Konkan Railway network (28 km from Dapoli, ~45 mins). Trains like Mandovi Express, Konkan Kanya, and Jan Shatabdi halt here. Frequent state transport (ST) buses and auto/taxis are available at Khed station.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>Beach Driving Caution for Tourists</span>
          </div>
          <p className="text-[11px] text-rose-800 leading-relaxed">
            Murud, Karde, and Ladghar beaches have soft wet sand. <strong>Do not drive non-4x4 private cars onto the beach</strong>, as vehicles can get stuck when high tide comes in. Park only in designated hotel parking areas.
          </p>
        </div>
      </div>
    </div>
  );
}
