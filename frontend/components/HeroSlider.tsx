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
  Compass,
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
    src: "/hero/hero-dolphin.jpg",
    title: "Morning Dolphin Boat Safari",
    tagline: "Watch wild Indo-Pacific dolphins leaping in sunrise waters",
    badge: "Murud & Karde Beach",
    location: "Dapoli Coast"
  },
  {
    id: 2,
    src: "/hero/hero-suvarnadurg.jpg",
    title: "Historic Suvarnadurg Sea Fort",
    tagline: "17th-century island sea fortress surrounded by Arabian Sea waves",
    badge: "Suvarnadurg Fort",
    location: "Harnai, Dapoli"
  },
  {
    id: 3,
    src: "/hero/hero-cottages.jpg",
    title: "Direct Beach-Touch Cottages",
    tagline: "Step straight from your Konkani cottage onto golden sands beneath palm canopies",
    badge: "Beachfront Access",
    location: "Palande & Karde Beach"
  },
  {
    id: 4,
    src: "/hero/hero-harnai-port.jpg",
    title: "Vibrant Harnai Fishing Port",
    tagline: "Legendary fish auctions and colorful traditional boats in the surf",
    badge: "Harnai Bandar",
    location: "Harnai Port"
  },
  {
    id: 5,
    src: "/hero/hero-beach-path.jpg",
    title: "Sunlit Coastal Pathways",
    tagline: "Private wooden walkways leading through lush greenery to the ocean",
    badge: "Gharghuti Hospitality",
    location: "Palande & Murud"
  },
  {
    id: 6,
    src: "/hero/hero-azure-waves.jpg",
    title: "Untouched Golden Shorelines",
    tagline: "Miles of peaceful golden sand and gentle turquoise tides",
    badge: "Konkan Coastline",
    location: "Dapoli Coast"
  },
  {
    id: 7,
    src: "/hero/hero-sunset-tide.png",
    title: "Golden Sunset Tide",
    tagline: "Crimson-amber dusk reflecting on tidal rocks and tranquil Arabian Sea waves",
    badge: "Tamas Tirtha",
    location: "Ladghar Beach"
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

  // Auto-slide every 4.5 seconds (4500ms) for comfortable reading pace
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);

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
      className="relative w-full min-h-[100dvh] flex flex-col justify-between overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-slate-950 select-none"
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
              <Compass className="w-3.5 h-3.5 text-konkan-sand-300" />
              <span>Trip Planner</span>
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
            className="bg-white/95 backdrop-blur-md px-3 sm:px-5 py-1.5 sm:py-2 rounded-2xl shadow-xl border border-white/40 flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-105 shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-konkan-teal-800 flex items-center justify-center text-white shadow-sm">
              <Waves className="w-4 h-4 text-konkan-teal-200" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-xl tracking-tight text-slate-950 leading-none">
                bhramo<span className="text-konkan-teal-600">.com</span>
              </span>
              <span className="text-[9px] font-semibold text-slate-500 hidden sm:block tracking-wide">
                Dapoli & Harnai Stays
              </span>
            </div>
          </Link>

          {/* Right Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Marathi / English Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-semibold transition-all shadow-md"
              title="Toggle English / Marathi"
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-konkan-teal-300" />
              <span className="font-bold">{language === "en" ? "EN" : "मराठी"}</span>
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
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all shadow-lg group shrink-0"
            >
              <span>Explore</span>
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-konkan-teal-800 text-white flex items-center justify-center group-hover:rotate-45 transition-transform">
                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 max-w-sm mx-auto bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
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
                className="col-span-2 p-2.5 rounded-xl bg-konkan-teal-900/60 text-konkan-sand-200 font-bold border border-konkan-teal-500/30 flex items-center justify-center gap-2 text-center"
              >
                <Compass className="w-4 h-4 text-konkan-sand-300" />
                <span>Custom Trip Planner</span>
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
                <div className="space-y-1.5">
                  {profile.role === "owner" && (
                    <Link
                      href="/owner/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full block py-2.5 rounded-xl bg-konkan-teal-700 text-center font-bold text-xs mb-1"
                    >
                      Host / Owner Dashboard
                    </Link>
                  )}
                  <Link
                    href="/my-bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full block py-2.5 rounded-xl bg-white/15 text-center font-bold text-xs"
                  >
                    My Account ({profile.name || "Profile"})
                  </Link>
                </div>
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
      <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-10 lg:py-14 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 sm:gap-8">
        {/* Left Heading & Copy */}
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] sm:text-xs font-semibold shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-konkan-sand-300" />
            <span>{SLIDES[currentSlide].badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.12] drop-shadow-md">
            Beachfront Stays & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-amber-100 to-konkan-sand-200 bg-clip-text text-transparent">
              Authentic Homestays
            </span>
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-slate-200 max-w-xl leading-relaxed font-normal drop-shadow-sm">
            Book verified coastal cottages directly with local Konkani hosts in Dapoli & Harnai. Direct host WhatsApp, 0% platform commission, and fresh home-cooked Konkani meals.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              href="/hotels"
              className="inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-4 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs sm:text-sm shadow-2xl transition-all group hover:scale-[1.02]"
            >
              <span>Explore Stays</span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-konkan-teal-800 text-white flex items-center justify-center group-hover:rotate-45 transition-transform">
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </Link>

            <Link
              href="/plan-trip"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-4 rounded-full bg-black/40 hover:bg-black/60 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/30 shadow-xl transition-all hover:scale-[1.02]"
            >
              <Compass className="w-4 h-4 text-konkan-sand-300" />
              <span>Custom Itinerary</span>
            </Link>
          </div>
        </div>

        {/* Right Quick Location Badges */}
        <div className="hidden sm:flex flex-col items-end gap-3 self-end">
          {/* Active Scene Spotlight */}
          <div className="bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-right max-w-xs shadow-xl transition-all duration-500">
            <span className="text-[10px] uppercase font-bold tracking-wider text-konkan-sand-300 block">
              {SLIDES[currentSlide].location}
            </span>
            <span className="text-xs font-bold text-white block mt-0.5">
              {SLIDES[currentSlide].title}
            </span>
            <span className="text-[11px] text-slate-300 block leading-snug mt-1">
              {SLIDES[currentSlide].tagline}
            </span>
          </div>

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
      <div className="relative z-30 w-full px-3 sm:px-8 lg:px-12 pb-6 sm:pb-10">
        <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">
          {/* Floating Search Form: 2 cols on mobile/tablet, 5 cols on desktop */}
          <form
            onSubmit={handleSearch}
            className="bg-white/95 backdrop-blur-lg p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/60 grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-2.5 items-center"
          >
            {/* 1. Place */}
            <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-konkan-teal-500 transition-colors">
              <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Place
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
                <select
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">All Coast</option>
                  <option value="Dapoli">Dapoli (Murud)</option>
                  <option value="Harnai">Harnai Port</option>
                </select>
              </div>
            </div>

            {/* 2. Hotel / Stay Type */}
            <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-konkan-teal-500 transition-colors">
              <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Stay Type
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HotelIcon className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
                <select
                  value={stayType}
                  onChange={(e) => setStayType(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">All Types</option>
                  <option value="resort">Resorts</option>
                  <option value="cottage">Cottages</option>
                  <option value="homestay">Homestays</option>
                </select>
              </div>
            </div>

            {/* 3. Date */}
            <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-konkan-teal-500 transition-colors">
              <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Date Range
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                />
              </div>
            </div>

            {/* 4. Room / Guests */}
            <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-konkan-teal-500 transition-colors">
              <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Guests
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5 text-konkan-teal-700 shrink-0" />
                <input
                  type="text"
                  value={guestsRoom}
                  onChange={(e) => setGuestsRoom(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
                />
              </div>
            </div>

            {/* 5. Search Button */}
            <div className="col-span-2 lg:col-span-1">
              <button
                type="submit"
                className="w-full h-[46px] sm:h-[50px] px-6 rounded-xl sm:rounded-2xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <Search className="w-4 h-4" />
                <span>Search Stays</span>
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
                {String(currentSlide + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
              </span>
            </div>

            <span className="hidden sm:inline-block text-[11px] text-white/70 font-medium">
              Auto-cycling every 4.5 seconds • Hover to pause
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
