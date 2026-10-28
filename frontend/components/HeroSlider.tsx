"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  MapPin,
  Calendar,
  Users,
  Search,
  ArrowUpRight,
  Sparkles,
  Waves,
  Hotel as HotelIcon,
  PhoneCall,
  Globe,
  Menu,
  X,
  User,
  ChevronDown
} from "lucide-react";

interface SlideItem {
  id: number;
  src: string;
  title: string;
  tagline: string;
  badge: string;
  location: string;
}

const SLIDES: SlideItem[] = [
  {
    id: 1,
    src: "/hero/hero-1.jpg",
    title: "Morning Dolphin Boat Safari",
    tagline: "Watch wild Indo-Pacific dolphins leaping in sunrise waters",
    badge: "Murud & Karde Beach",
    location: "Dapoli Coast"
  },
  {
    id: 2,
    src: "/hero/hero-2.png",
    title: "Leaping Arabian Dolphins",
    tagline: "Crystal blue waves and pristine coastal marine sanctuary",
    badge: "Konkan Marine Safari",
    location: "Harnai Port"
  },
  {
    id: 3,
    src: "/hero/hero-3.jpg",
    title: "Vast Untouched Shorelines",
    tagline: "Miles of golden and silver sand lined by betel-nut wadis",
    badge: "Aerial Coastal Panorama",
    location: "Dapoli Coast"
  },
  {
    id: 4,
    src: "/hero/hero-4.jpg",
    title: "Fiery Crimson Sunsets",
    tagline: "Tropical coconut groves kissing the glowing Arabian Sea",
    badge: "Tamas Tirtha Sunset",
    location: "Ladghar Beach"
  },
  {
    id: 5,
    src: "/hero/hero-5.png",
    title: "Enchanting Coastal Twilight",
    tagline: "Serene reflections and tranquil waves along the Konkan shoreline",
    badge: "Golden Sunset Tide",
    location: "Palande & Harnai Coast"
  }
];

export function HeroSlider() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Search Bar Form State
  const [place, setPlace] = useState<string>("all");
  const [stayType, setStayType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("Fri, Oct 16 - Sun, Oct 18");
  const [guestsRoom, setGuestsRoom] = useState<string>("2 Adults, 1 Room");

  // Auto-slide every 2 seconds (2000ms) as requested
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (place && place !== "all") params.set("area", place);
    router.push(`/hotels?${params.toString()}`);
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "mr" : "en");
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 select-none"
    >
      {/* ========================================================= */}
      {/* 1. BACKGROUND FULL-SCREEN SLIDESHOW (2s Crossfade)       */}
      {/* ========================================================= */}
      {SLIDES.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className={`object-cover transform transition-transform duration-[3000ms] ease-out ${
                isActive ? "scale-105" : "scale-100"
              }`}
            />
          </div>
        );
      })}

      {/* Modern Vignette & Contrast Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/60" />

      {/* ========================================================= */}
      {/* 2. TOP FULL-SCREEN FLOATING HEADER & NAVIGATION           */}
      {/* ========================================================= */}
      <header className="relative z-30 w-full px-4 sm:px-8 lg:px-12 pt-5 sm:pt-7">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-white shadow-lg">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-full bg-white text-slate-950 font-bold transition-all shadow-sm"
            >
              Home
            </Link>
            <Link
              href="/hotels"
              className="px-3 py-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/15 transition-all"
            >
              Hotels
            </Link>
            <Link
              href="/plan-trip"
              className="px-3 py-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/15 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Trip Planner</span>
              <span className="text-[9px] bg-emerald-500/30 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                New
              </span>
            </Link>
            <Link
              href="/services"
              className="px-3 py-1.5 rounded-full text-slate-200 hover:text-white hover:bg-white/15 transition-all"
            >
              Experiences
            </Link>
            <Link
              href="/hotels/dapoli"
              className="px-2.5 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/15 transition-all"
            >
              Dapoli
            </Link>
            <Link
              href="/hotels/harnai"
              className="px-2.5 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/15 transition-all"
            >
              Harnai
            </Link>
          </nav>

          {/* Center Brand Logo with refined cut-out pill */}
          <Link
            href="/"
            className="bg-white/95 backdrop-blur-md px-4 sm:px-5 py-2 rounded-2xl shadow-xl border border-white/40 flex items-center gap-2.5 transition-transform hover:scale-105"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-konkan-teal-800 flex items-center justify-center text-white shadow-sm">
              <Waves className="w-4 h-4 text-konkan-teal-200" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg sm:text-xl tracking-tight text-slate-950 leading-none">
                bhramo<span className="text-konkan-teal-600">.com</span>
              </span>
              <span className="text-[9px] font-semibold text-slate-500 hidden sm:block tracking-wide">
                Dapoli & Harnai Stays
              </span>
            </div>
          </Link>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Marathi / English Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all shadow-md"
              title="Toggle English / Marathi"
            >
              <Globe className="w-3.5 h-3.5 text-konkan-teal-300" />
              <span className="font-bold">{language === "en" ? "EN" : "मराठी"}</span>
              <span className="text-[10px] text-slate-300">
                {language === "en" ? "मराठी" : "EN"}
              </span>
            </button>

            {/* Direct WhatsApp Concierge */}
            <a
              href="https://wa.me/917447568595?text=Hello%20bhramo.com,%20I%20would%20like%20to%20inquire%20about%20booking%20a%20stay%20in%20Dapoli/Harnai"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>WhatsApp Help</span>
            </a>

            {/* Auth / Profile Link */}
            {profile ? (
              <Link
                href={
                  profile.role === "admin"
                    ? "/admin"
                    : profile.role === "owner"
                    ? "/owner/dashboard"
                    : "/my-bookings"
                }
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all shadow-md"
              >
                <User className="w-3.5 h-3.5 text-konkan-teal-300" />
                <span className="truncate max-w-[90px]">{profile.name || "Account"}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all shadow-md"
              >
                <span>Login</span>
              </Link>
            )}

            {/* Book Now Button */}
            <Link
              href="/hotels"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all shadow-lg group"
            >
              <span>Book Now</span>
              <div className="w-5 h-5 rounded-full bg-konkan-teal-800 text-white flex items-center justify-center group-hover:rotate-45 transition-transform">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 max-w-sm mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl text-white space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center"
              >
                Home
              </Link>
              <Link
                href="/hotels"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center"
              >
                Hotels
              </Link>
              <Link
                href="/plan-trip"
                onClick={() => setMobileMenuOpen(false)}
                className="col-span-2 p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center justify-center gap-2 text-center"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Trip Planner</span>
              </Link>
              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center"
              >
                Experiences
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center"
              >
                Contact
              </Link>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold"
              >
                <Globe className="w-4 h-4 text-konkan-teal-400" />
                <span>Lang: {language === "en" ? "English" : "मराठी"}</span>
              </button>

              <a
                href="https://wa.me/917447568595"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 font-semibold flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>WhatsApp Help</span>
              </a>
            </div>

            <div className="pt-1">
              {profile ? (
                <Link
                  href="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block py-2.5 rounded-xl bg-konkan-teal-700 text-center font-bold text-xs"
                >
                  My Account ({profile.name || "Profile"})
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block py-2.5 rounded-xl bg-white text-slate-950 text-center font-bold text-xs"
                >
                  Host / Guest Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 3. CENTER HERO HEADINGS & FLOATING JOURNEY WIDGET         */}
      {/* ========================================================= */}
      <div className="relative z-20 max-w-7xl mx-auto w-full px-6 sm:px-12 py-10 sm:py-14 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
        {/* Left Heading & Copy */}
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{SLIDES[currentSlide].badge}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
            Inspired Travels <br />
            <span className="bg-gradient-to-r from-white via-slate-100 to-konkan-teal-200 bg-clip-text text-transparent">
              in Dapoli & Harnai
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed font-normal drop-shadow-sm">
            Discover immersive eco-luxury beachfront stays where wild dolphins, golden beaches, and authentic Konkani hospitality come together.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm shadow-2xl transition-all group hover:scale-[1.02]"
            >
              <span>Explore Stays</span>
              <div className="w-6 h-6 rounded-full bg-konkan-teal-800 text-white flex items-center justify-center group-hover:rotate-45 transition-transform">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/plan-trip"
              className="inline-flex items-center gap-2 px-6 py-3.5 sm:py-4 rounded-full bg-black/40 hover:bg-black/60 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/30 shadow-xl transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Trip Planner</span>
            </Link>
          </div>
        </div>

        {/* Right Quick Location Badges */}
        <div className="hidden sm:flex flex-col items-end gap-3 self-end">
          {/* Quick Location Pills */}
          <div className="flex items-center gap-2">
            <Link
              href="/hotels/dapoli"
              className="px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dapoli Coast</span>
            </Link>
            <Link
              href="/hotels/harnai"
              className="px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Harnai Port</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM FLOATING SEARCH BAR & SLIDE PROGRESS            */}
      {/* ========================================================= */}
      <div className="relative z-30 w-full px-4 sm:px-8 lg:px-12 pb-8 sm:pb-12">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Floating Search Form */}
          <form
            onSubmit={handleSearch}
            className="bg-white/95 backdrop-blur-lg p-3 sm:p-4 rounded-3xl shadow-2xl border border-white/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-center"
          >
            {/* 1. Place */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-konkan-teal-500 transition-colors">
              <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Place
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
                <select
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">All Konkan Coastline</option>
                  <option value="Dapoli">Dapoli (Murud & Karde)</option>
                  <option value="Harnai">Harnai (Fort & Port)</option>
                </select>
              </div>
            </div>

            {/* 2. Hotel / Stay Type */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-konkan-teal-500 transition-colors">
              <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Hotel Type
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HotelIcon className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
                <select
                  value={stayType}
                  onChange={(e) => setStayType(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">All Property Types</option>
                  <option value="resort">Beachfront Resorts</option>
                  <option value="cottage">Laterite Eco Cottages</option>
                  <option value="homestay">Authentic Homestays</option>
                </select>
              </div>
            </div>

            {/* 3. Date */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-konkan-teal-500 transition-colors">
              <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Date
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Room & Search Button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-konkan-teal-500 transition-colors">
                <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Room
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
                  <input
                    type="text"
                    value={guestsRoom}
                    onChange={(e) => setGuestsRoom(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="h-[52px] px-6 sm:px-7 rounded-2xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-1.5 shrink-0 hover:scale-[1.02]"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Slide Indicator Dots & Numbers */}
          <div className="flex items-center justify-between text-white text-xs pt-1 px-2">
            <div className="flex items-center gap-2">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide
                      ? "w-8 bg-white shadow-sm"
                      : "w-2.5 bg-white/40 hover:bg-white/75"
                  }`}
                  title={`Switch to Slide ${i + 1}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
              <span className="text-[11px] text-white/90 font-mono ml-2 font-bold">
                0{currentSlide + 1} / 0{SLIDES.length}
              </span>
            </div>

            <span className="hidden sm:inline-block text-[11px] text-white/70 font-medium">
              Auto-cycling every 2 seconds • Hover to pause
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
