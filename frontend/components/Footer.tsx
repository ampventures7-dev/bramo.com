import Link from "next/link";
import { Waves, Heart, MapPin, Phone, MessageSquare } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-konkan-sand-100 border-t border-konkan-sand-200 text-slate-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-konkan-teal-700 flex items-center justify-center text-white">
                <Waves className="w-4 h-4 text-konkan-teal-200" />
              </div>
              <span className="font-bold text-lg text-konkan-teal-950">
                bhramo<span className="text-konkan-teal-600">.com</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Curated homestays, sea-facing resorts, and rustic cottages nestled along the pristine beaches of Dapoli and Harnai in Maharashtra, India.
            </p>
            <div className="pt-1 text-xs text-konkan-sand-800 font-medium">
              🌿 Konkan Coastal Hospitality
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-konkan-teal-950 uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-konkan-teal-700 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/hotels" className="hover:text-konkan-teal-700 transition-colors">
                  Explore Hotels & Cottages
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-konkan-teal-700 transition-colors">
                  Local Experiences & Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-konkan-teal-700 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-konkan-teal-700 transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-konkan-teal-700 transition-colors">
                  Account / Host Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Destinations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-konkan-teal-950 uppercase tracking-wider">
              Coastal Destinations
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href="/hotels/dapoli" className="flex items-center gap-1.5 hover:text-konkan-teal-700 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-konkan-teal-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Hotels in Dapoli</span>
                  <span className="text-slate-500">(Murud, Ladghar, Karde)</span>
                </Link>
              </li>
              <li>
                <Link href="/hotels/harnai" className="flex items-center gap-1.5 hover:text-konkan-teal-700 transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-konkan-teal-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Hotels in Harnai</span>
                  <span className="text-slate-500">(Suvarnadurg, Fish Port)</span>
                </Link>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500 pt-1">
                <span>Murud Beach (Water sports & Dolphins)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-500">
                <span>Ladghar Beach (Tamas Tirtha Sunset)</span>
              </li>
            </ul>
          </div>

          {/* Direct Support & Payment note */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-konkan-teal-950 uppercase tracking-wider">
              Direct Konkan Support
            </h4>
            <p className="text-xs text-slate-600">
              Reserve with 0% extra commissions. Pay on arrival at hotel or directly to the owner via verified UPI QR.
            </p>
            <a
              href="https://wa.me/919876543210?text=Hi%20bhramo.com%20team,%20I%20have%20an%20inquiry%20regarding%20hotel%20booking"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Connect on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Legal links and bottom copyright */}
        <div className="border-t border-konkan-sand-200/80 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <Link href="/terms" className="hover:text-konkan-teal-800 hover:underline">
              Terms & Conditions
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-konkan-teal-800 hover:underline">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/cancellation-policy" className="hover:text-konkan-teal-800 hover:underline">
              Cancellation & Refund Policy
            </Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-konkan-teal-800 hover:underline">
              Contact Desk
            </Link>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span>© {new Date().getFullYear()} bhramo.com · Built for Dapoli & Harnai</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 mx-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
