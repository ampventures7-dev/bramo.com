"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Waves,
  Menu,
  X,
  PhoneCall,
  LogOut,
  User,
  CalendarCheck,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Sparkles
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // On the homepage, the full-screen hero provides its own immersive header
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-konkan-sand-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-konkan-teal-700 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Waves className="w-5 h-5 text-konkan-teal-200" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-konkan-teal-950 flex items-center gap-1">
                bhramo<span className="text-konkan-teal-600">.com</span>
              </span>
              <span className="text-[10px] text-konkan-sand-700 font-medium tracking-wide">
                {t("nav.subtitle")}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-konkan-teal-50 text-konkan-teal-800 border border-konkan-teal-200/60"
                  : "text-slate-600 hover:text-konkan-teal-800 hover:bg-konkan-sand-50"
              }`}
            >
              {t("nav.home")}
            </Link>

            <Link
              href="/hotels"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive("/hotels")
                  ? "bg-konkan-teal-50 text-konkan-teal-800 border border-konkan-teal-200/60"
                  : "text-slate-600 hover:text-konkan-teal-800 hover:bg-konkan-sand-50"
              }`}
            >
              {t("nav.hotels")}
            </Link>

            <Link
              href="/services"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive("/services")
                  ? "bg-konkan-teal-50 text-konkan-teal-800 border border-konkan-teal-200/60"
                  : "text-slate-600 hover:text-konkan-teal-800 hover:bg-konkan-sand-50"
              }`}
            >
              {t("nav.experiences")}
            </Link>

            <Link
              href="/plan-trip"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                isActive("/plan-trip")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : "text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>AI Trip Planner</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full border border-emerald-200">
                New
              </span>
            </Link>

            {/* Role-Specific Links */}
            {profile?.role === "guest" && (
              <Link
                href="/my-bookings"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive("/my-bookings")
                    ? "bg-konkan-teal-50 text-konkan-teal-800 border border-konkan-teal-200/60"
                    : "text-slate-600 hover:text-konkan-teal-800 hover:bg-konkan-sand-50"
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-konkan-teal-600" />
                <span>{t("nav.my_bookings")}</span>
              </Link>
            )}

            {(profile?.role === "owner" || profile?.role === "admin") && (
              <Link
                href="/owner/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive("/owner/dashboard")
                    ? "bg-konkan-teal-50 text-konkan-teal-800 border border-konkan-teal-200/60"
                    : "text-slate-600 hover:text-konkan-teal-800 hover:bg-konkan-sand-50"
                }`}
              >
                <Building2 className="w-4 h-4 text-konkan-teal-600" />
                <span>{t("nav.owner_dashboard")}</span>
              </Link>
            )}

            {profile?.role === "admin" && (
              <>
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive("/admin") && !isActive("/admin/payments")
                      ? "bg-purple-50 text-purple-900 border border-purple-300 font-bold"
                      : "text-slate-600 hover:text-purple-800 hover:bg-purple-50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>{t("nav.admin_portal")}</span>
                </Link>

                <Link
                  href="/admin/payments"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive("/admin/payments")
                      ? "bg-amber-50 text-amber-900 border border-amber-300 font-bold"
                      : "text-slate-600 hover:text-amber-800 hover:bg-amber-50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Payments</span>
                </Link>
              </>
            )}

            {!profile && (
              <>
                <Link
                  href="/login"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive("/login")
                      ? "bg-konkan-teal-50 text-konkan-teal-800 border border-konkan-teal-200/60"
                      : "text-slate-600 hover:text-konkan-teal-800 hover:bg-konkan-sand-50"
                  }`}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 rounded-md text-sm font-semibold bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Right Action: User Status, Language Switcher & Logout */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-konkan-sand-100 p-0.5 rounded-full border border-konkan-sand-300/70 text-[11px] shadow-xs">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                  language === "en"
                    ? "bg-konkan-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("mr")}
                className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                  language === "mr"
                    ? "bg-konkan-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="मराठी (Marathi)"
              >
                मराठी
              </button>
            </div>

            {profile ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-konkan-sand-100 px-2.5 py-1 rounded-full border border-konkan-sand-200 text-xs">
                  <User className="w-3.5 h-3.5 text-konkan-teal-700" />
                  <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                    {profile.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold bg-konkan-teal-100 text-konkan-teal-800 px-1.5 py-0.2 rounded-full">
                    {profile.role}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("nav.logout")}</span>
                </button>
              </div>
            ) : (
              <a
                href="https://wa.me/919876543210?text=Hi%20bhramo.com,%20I%20need%20help%20finding%20a%20hotel%20in%20Dapoli%20or%20Harnai"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>WhatsApp Help</span>
              </a>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-konkan-sand-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-konkan-sand-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {profile && (
            <div className="flex items-center justify-between p-2.5 bg-konkan-sand-50 rounded-xl border border-konkan-sand-200 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-konkan-teal-700" />
                <span className="text-xs font-bold text-slate-800">{profile.name}</span>
                <span className="text-[10px] uppercase font-bold bg-konkan-teal-100 text-konkan-teal-800 px-1.5 py-0.5 rounded">
                  {profile.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-1 text-xs text-rose-700 font-semibold px-2 py-1 bg-rose-50 rounded"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-konkan-sand-50"
          >
            Home
          </Link>
          <Link
            href="/hotels"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-konkan-sand-50"
          >
            Hotels
          </Link>
          <Link
            href="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-konkan-sand-50"
          >
            Experiences & Services
          </Link>
          <Link
            href="/plan-trip"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-bold text-emerald-800 bg-emerald-50/70 border border-emerald-200"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>AI Trip Planner</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
              Free
            </span>
          </Link>

          {profile?.role === "guest" && (
            <Link
              href="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-konkan-sand-50"
            >
              My Bookings
            </Link>
          )}

            {profile?.role === "admin" && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-purple-900 bg-purple-50"
                >
                  Admin Portal
                </Link>
                <Link
                  href="/admin/payments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-amber-900 bg-amber-50"
                >
                  Payments & Ledger
                </Link>
              </>
            )}

          {!profile ? (
            <div className="pt-2 border-t border-konkan-sand-100 flex gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg border border-konkan-sand-300 text-slate-800 hover:bg-konkan-sand-50"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-konkan-teal-700 text-white hover:bg-konkan-teal-800"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
