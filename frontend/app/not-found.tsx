import Link from "next/link";
import { Waves, Compass, ArrowRight, Home, Hotel } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-konkan-sand-200 shadow-xl text-center space-y-6">
        {/* Animated Icon */}
        <div className="w-16 h-16 bg-konkan-sand-100 rounded-3xl flex items-center justify-center mx-auto border border-konkan-sand-200 shadow-inner">
          <Waves className="w-8 h-8 text-konkan-teal-700 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black tracking-widest text-konkan-teal-700 uppercase">
            Error 404 · Lost Coastline
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Lost in the Waves?
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The coastal page or hotel you are looking for has either drifted away with the tide, been renamed, or does not exist.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-800 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>

          <Link
            href="/hotels"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-konkan-sand-300 bg-konkan-sand-50/50 hover:bg-konkan-sand-100 text-slate-800 font-bold text-xs transition-colors"
          >
            <Hotel className="w-3.5 h-3.5 text-konkan-teal-700" />
            <span>Browse Hotels</span>
          </Link>
        </div>

        <div className="pt-3 border-t border-konkan-sand-100 text-[11px] text-slate-400">
          Need immediate help? Reach our Konkan desk on WhatsApp at{" "}
          <strong className="text-slate-600">+91 98765 43210</strong>
        </div>
      </div>
    </div>
  );
}
