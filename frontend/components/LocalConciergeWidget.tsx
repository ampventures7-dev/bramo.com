"use client";

import { useState } from "react";
import { MessageSquare, Phone, X, Sparkles, MapPin, CheckCircle2 } from "lucide-react";

interface LocalConciergeWidgetProps {
  customPhone?: string;
  defaultHotelName?: string;
}

export function LocalConciergeWidget({
  customPhone = "917447568595",
  defaultHotelName,
}: LocalConciergeWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const prefilledMessage = defaultHotelName
    ? `Hi Prachii! I am inquiring about *${defaultHotelName}* on bhramo.com. Can you assist me with availability, meals, and booking?`
    : `Hi Prachii! I am planning a trip to Dapoli / Harnai and would love local guidance on verified beachfront stays, homemade seafood, and road conditions.`;

  const waUrl = `https://wa.me/${customPhone.replace(/\D/g, "")}?text=${encodeURIComponent(prefilledMessage)}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end select-none">
      {/* Expanded Concierge Popover Card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-88 rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-5 text-slate-900 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-sm shadow-md ring-2 ring-emerald-100">
                  <span>PP</span>
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-slate-900">Prachii Pawar</h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">Co-Founder & Dapoli Local Host</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close concierge preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Local Guidance</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed font-medium">
              &quot;Namaskar! I live right here in Dapoli. Message me if you need road updates via Tamhini or Mangaon, authentic seafood thalis, dolphin safari boat timings, or stay availability.&quot;
            </p>
          </div>

          <div className="space-y-1 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>0% Platform Commission · Direct Host Rates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Instant Help on WhatsApp (+91 74475 68595)</span>
            </div>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>Chat with Prachii (+91 74475 68595)</span>
          </a>
        </div>
      )}

      {/* Floating Action Trigger Button */}
      <div className="flex items-center gap-2">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-xs font-bold text-slate-800 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all hover:scale-105"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ask Prachii (Dapoli Co-Founder)</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen
              ? "bg-slate-900 rotate-90"
              : "bg-gradient-to-r from-emerald-600 to-konkan-teal-700 hover:from-emerald-700 hover:to-konkan-teal-800"
          }`}
          aria-label="Open Local Dapoli Concierge Chat"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 fill-white/20" />}
        </button>
      </div>
    </div>
  );
}

