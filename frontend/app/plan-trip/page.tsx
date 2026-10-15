"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import {
  TripDuration,
  TravelerType,
  BudgetTier,
  GeneratedTripPlan,
} from "@/lib/trip-planner-data";
import {
  Sparkles,
  Waves,
  Calendar,
  Users,
  Compass,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Share2,
  Printer,
  RotateCcw,
  Clock,
  MapPin,
  Star,
  Info,
  ShieldCheck,
  Fish,
  Anchor,
  Sunset,
  Ship,
  Hotel as HotelIcon,
  MessageSquare,
  Zap,
  ArrowUpRight
} from "lucide-react";

const AVAILABLE_INTERESTS = [
  { id: "dolphins", label: "Dolphin Safaris", icon: "🐬" },
  { id: "watersports", label: "Water Sports & Jet Ski", icon: "🏄" },
  { id: "seafood", label: "Harnai Fish Auction & Seafood", icon: "🐟" },
  { id: "forts", label: "Suvarnadurg Sea Fort", icon: "🏰" },
  { id: "temples", label: "Keshavraj Forest Trek & Temples", icon: "⛩️" },
  { id: "sunset", label: "Ladghar Red Sand Sunset", icon: "🌅" },
  { id: "peace", label: "Quiet Secluded Beaches", icon: "🏖️" },
];

const QUICK_STARTERS = [
  {
    title: "🐬 Dolphin Safari & Beach Weekend",
    duration: "2_days" as TripDuration,
    traveler: "couple" as TravelerType,
    budget: "mid" as BudgetTier,
    interests: ["dolphins", "sunset", "seafood"]
  },
  {
    title: "👨‍👩‍👧‍👦 Family Beach & Sea Forts",
    duration: "3_days" as TripDuration,
    traveler: "family" as TravelerType,
    budget: "mid" as BudgetTier,
    interests: ["dolphins", "forts", "seafood", "peace"]
  },
  {
    title: "🏄 Thrilling Watersports & Friends Crawl",
    duration: "3_days" as TripDuration,
    traveler: "friends" as TravelerType,
    budget: "budget" as BudgetTier,
    interests: ["watersports", "dolphins", "seafood", "sunset"]
  },
  {
    title: "⛩️ Rainforest Spring & Quiet Coastal Zen",
    duration: "2_days" as TripDuration,
    traveler: "solo" as TravelerType,
    budget: "luxury" as BudgetTier,
    interests: ["temples", "peace", "sunset"]
  }
];

const LOADING_FACTS = [
  "Calculating dolphin safari timing for sunrise tides...",
  "Timing the 4:00 PM beach fish auction at Harnai harbor...",
  "Routing scenic roads between Murud, Ladghar, and Harnai...",
  "Selecting top-rated coastal homestays on bhramo.com...",
];

export default function TripPlannerPage() {
  const [duration, setDuration] = useState<TripDuration>("3_days");
  const [travelerType, setTravelerType] = useState<TravelerType>("couple");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "dolphins",
    "seafood",
    "sunset",
  ]);
  const [budget, setBudget] = useState<BudgetTier>("mid");

  const [loading, setLoading] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [tripPlan, setTripPlan] = useState<GeneratedTripPlan | null>(null);
  const [planSource, setPlanSource] = useState<string>("gemini_ai");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const applyStarter = (starter: typeof QUICK_STARTERS[0]) => {
    setDuration(starter.duration);
    setTravelerType(starter.traveler);
    setBudget(starter.budget);
    setSelectedInterests(starter.interests);
  };

  const handleGeneratePlan = async () => {
    setErrorMsg(null);
    setLoading(true);

    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % LOADING_FACTS.length);
    }, 1800);

    try {
      const res = await fetch("/api/trip-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration,
          travelerType,
          interests: selectedInterests,
          budget,
        }),
      });

      clearInterval(factInterval);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Failed to generate plan. Please try again.");
      } else {
        setTripPlan(data.plan);
        setPlanSource(data.source || "gemini_ai");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      clearInterval(factInterval);
      setErrorMsg(err.message || "Network error while generating your plan.");
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp share message formatter
  const getWhatsAppShareUrl = () => {
    if (!tripPlan) return "#";
    let text = `🌴 *${tripPlan.title}* (${tripPlan.durationLabel})\n`;
    text += `Curated for: ${tripPlan.travelerLabel}\n`;
    text += `Estimated Total: ₹${tripPlan.estimatedBudget.totalMin.toLocaleString("en-IN")} - ₹${tripPlan.estimatedBudget.totalMax.toLocaleString("en-IN")}\n\n`;

    tripPlan.days.forEach((d) => {
      text += `📅 *Day ${d.dayNumber}: ${d.theme}* (${d.focusArea})\n`;
      d.activities.forEach((a) => {
        text += `• ${a.time}: ${a.title} (${a.location})\n`;
      });
      if (d.recommendedStay) {
        text += `🏨 Stay: ${d.recommendedStay.name}\n\n`;
      }
    });

    text += `Plan created via bhramo.com AI Coastal Architect`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-12 pb-24 bg-[#faf8f5]">
      {/* 1. TOP EDITORIAL BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-konkan-teal-950 to-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Coastal Travel Architect for Dapoli & Harnai</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Craft Your Perfect Coastal Escape in <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-slate-100 to-konkan-teal-200 bg-clip-text text-transparent">
              Dapoli & Harnai
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Personalized hour-by-hour itineraries with real tide windows, dolphin boat slots, 4 PM fish auction timing, and verified stays on <strong>bhramo.com</strong>.
          </p>
        </div>
      </section>

      {/* 2. LOADING SCREEN */}
      {loading && (
        <div className="max-w-xl mx-auto -mt-8 px-4 relative z-20">
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-konkan-teal-50 border-2 border-konkan-teal-200 text-konkan-teal-700 rounded-3xl flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <Compass className="w-8 h-8 text-konkan-teal-700 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900">
                Designing Your Konkan Itinerary...
              </h2>
              <p className="text-xs text-konkan-teal-800 font-medium transition-all duration-300">
                {LOADING_FACTS[factIndex]}
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-konkan-teal-600 to-emerald-500 h-2 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* 3. INTAKE FORM (When no plan generated yet and not loading) */}
      {!loading && !tripPlan && (
        <div className="max-w-4xl mx-auto -mt-8 px-4 relative z-20 space-y-8">
          {/* Quick Starter Templates */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Or Pick a 1-Click Curated Escape:</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {QUICK_STARTERS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyStarter(s)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-konkan-teal-50 hover:border-konkan-teal-300 border border-slate-200 text-left transition-all text-xs font-bold text-slate-800 shadow-xs group"
                >
                  <span className="block group-hover:text-konkan-teal-900">{s.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal block mt-1">
                    {s.duration === "2_days" ? "2 Days" : "3 Days"} · {s.traveler}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-7 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* A. Trip Duration */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-konkan-teal-700" />
                <span>1. How long is your trip?</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "2_days", label: "2 Days / 1 Night", sub: "Weekend Escape" },
                  { id: "3_days", label: "3 Days / 2 Nights", sub: "Most Popular", popular: true },
                  { id: "4_days", label: "4 Days / 3 Nights", sub: "Complete Leisure" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDuration(d.id as TripDuration)}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      duration === d.id
                        ? "border-konkan-teal-700 bg-konkan-teal-50/70 ring-2 ring-konkan-teal-700/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{d.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{d.sub}</div>
                    </div>
                    {d.popular && (
                      <span className="mt-2 inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                        Recommended
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* B. Traveler Type */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Users className="w-4 h-4 text-konkan-teal-700" />
                <span>2. Who is traveling?</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: "couple", label: "Couple", icon: "👫", desc: "Romantic & relaxed" },
                  { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦", desc: "Kids & elders friendly" },
                  { id: "friends", label: "Friends Group", icon: "🎒", desc: "Adventure & thrill" },
                  { id: "solo", label: "Solo Explorer", icon: "🚶", desc: "Peace & heritage" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTravelerType(t.id as TravelerType)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      travelerType === t.id
                        ? "border-konkan-teal-700 bg-konkan-teal-50/70 ring-2 ring-konkan-teal-700/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <div className="font-bold text-xs text-slate-900 mt-1">{t.label}</div>
                    <div className="text-[10px] text-slate-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* C. Interests */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Compass className="w-4 h-4 text-konkan-teal-700" />
                <span>3. What experiences excite you?</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isChecked = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                        isChecked
                          ? "border-konkan-teal-700 bg-konkan-teal-50 text-konkan-teal-950 ring-1 ring-konkan-teal-700/30"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-base">{interest.icon}</span>
                      <span className="line-clamp-1">{interest.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* D. Budget Tier */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-konkan-teal-700" />
                <span>4. Comfort & Budget Tier</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "budget", label: "Homestays", sub: "₹1,500 - ₹2,500 / night" },
                  { id: "mid", label: "Eco Cottages & Beach Stays", sub: "₹2,500 - ₹4,000 / night", popular: true },
                  { id: "luxury", label: "Luxury Sea-Facing Resorts", sub: "₹4,000+ / night" },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBudget(b.id as BudgetTier)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      budget === b.id
                        ? "border-konkan-teal-700 bg-konkan-teal-50/70 ring-2 ring-konkan-teal-700/30"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{b.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{b.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Free instant AI planner • Direct hotel bookings with 0% fee</span>
              </div>

              <button
                type="button"
                onClick={handleGeneratePlan}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-black text-sm shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>Generate My Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PLAN RESULTS VIEW */}
      {tripPlan && !loading && (
        <div className="max-w-4xl mx-auto -mt-8 px-4 relative z-20 space-y-8">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
            <button
              type="button"
              onClick={() => setTripPlan(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-konkan-teal-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Customize & Create New Plan</span>
            </button>

            <div className="flex items-center gap-2.5">
              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Plan Overview Card */}
          <div className="bg-white p-7 sm:p-9 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold bg-konkan-teal-100 text-konkan-teal-900 px-3 py-1 rounded-full">
                  {tripPlan.durationLabel}
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  For: {tripPlan.travelerLabel}
                </span>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 ml-auto">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {planSource === "gemini_ai" ? "Powered by Google Gemini AI" : "Local Konkan Travel Engine"}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                {tripPlan.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {tripPlan.tagline}
              </p>
            </div>

            {/* Estimated Budget Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Total</span>
                <div className="text-base sm:text-lg font-black text-konkan-teal-900 mt-0.5">
                  ₹{tripPlan.estimatedBudget.totalMin.toLocaleString("en-IN")} - ₹{tripPlan.estimatedBudget.totalMax.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stay Cost</span>
                <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                  ₹{tripPlan.estimatedBudget.stayCost.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Food & Dining</span>
                <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                  ₹{tripPlan.estimatedBudget.foodCost.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activities & Safaris</span>
                <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                  ₹{tripPlan.estimatedBudget.activityCost.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Local Coastal Advisory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sunset className="w-4 h-4 text-amber-700" />
                  <span>Season Advisory</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  {tripPlan.bestSeasonNote}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-blue-700" />
                  <span>Tide & Timing Rules</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  {tripPlan.tideAndRouteAdvisory}
                </p>
              </div>
            </div>
          </div>

          {/* Day-by-Day Timeline */}
          <div className="space-y-6">
            {tripPlan.days.map((day) => (
              <div
                key={day.dayNumber}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Day Header */}
                <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-konkan-teal-700 text-white font-black flex items-center justify-center text-sm shadow-sm">
                      D{day.dayNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg">{day.theme}</h3>
                      <span className="text-xs text-slate-300">Focus: {day.focusArea}</span>
                    </div>
                  </div>
                </div>

                {/* Activities Timeline */}
                <div className="p-6 space-y-4">
                  {day.activities.map((act, actIdx) => (
                    <div
                      key={actIdx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-konkan-teal-100 text-konkan-teal-900">
                            {act.time}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {act.location}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{act.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {act.insiderTip || act.tagline}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-700">
                          {act.estimatedCost || "Free"}
                        </span>
                        <span className="block text-[10px] text-slate-400 capitalize">
                          {act.period} slot
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Day Stay Recommendation Card */}
                  {day.recommendedStay && (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-konkan-teal-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                          <HotelIcon className="w-3.5 h-3.5" />
                          <span>Recommended Stay on bhramo.com</span>
                        </span>
                        <h4 className="font-black text-base text-white">
                          {day.recommendedStay.name}
                        </h4>
                        <p className="text-xs text-slate-300">
                          {day.recommendedStay.highlights?.join(" • ") || day.recommendedStay.area}
                        </p>
                      </div>

                      <Link
                        href={`/hotels/${day.recommendedStay.id}`}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-all shrink-0 shadow-md"
                      >
                        <span>Reserve Stay</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
