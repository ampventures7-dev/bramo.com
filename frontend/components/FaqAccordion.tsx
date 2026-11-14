"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, PhoneCall, Sparkles } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
  defaultOpenIndices?: number[];
  allowMultiple?: boolean;
  conciergePhone?: string;
  title?: string;
}

export function FaqAccordion({
  faqs,
  defaultOpenIndices = [0], // Keep first question open by default so users see it's interactive
  allowMultiple = true,
  conciergePhone = "917447568595",
  title,
}: FaqAccordionProps) {
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set(defaultOpenIndices));

  const toggle = (idx: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        if (!allowMultiple) {
          next.clear();
        }
        next.add(idx);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (openSet.size === faqs.length) {
      setOpenSet(new Set());
    } else {
      setOpenSet(new Set(faqs.map((_, i) => i)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Interactive hint + Expand/Collapse All */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Click any question to view answer & tips</span>
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="font-extrabold text-konkan-teal-800 hover:text-konkan-teal-950 hover:underline transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg"
        >
          {openSet.size === faqs.length ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* Accordion Items List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openSet.has(idx);

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-2xs ${
                isOpen
                  ? "border-konkan-teal-400 ring-1 ring-konkan-teal-400/30"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className={`w-full p-4 sm:p-5 flex items-start justify-between gap-3 text-left transition-colors select-none cursor-pointer group ${
                  isOpen ? "bg-konkan-teal-50/30" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span
                    className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isOpen
                        ? "bg-konkan-teal-800 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 group-hover:bg-konkan-teal-100 group-hover:text-konkan-teal-900"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-konkan-teal-900 transition-colors leading-snug">
                    {faq.q}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                    {isOpen ? "Close" : "Open"}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-slate-400 transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 text-white bg-konkan-teal-800 shadow-xs"
                        : "bg-slate-100 group-hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 animate-in fade-in-50 duration-200">
                  <div className="pl-9 pr-2 pt-2.5 border-t border-slate-100">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed aeo-faq-answer">
                      {faq.a}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Concierge Help Link */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium">
            Have a question about road conditions, dolphin boats, or homestay food?
          </span>
        </div>
        <a
          href={`https://wa.me/${conciergePhone}?text=${encodeURIComponent("Hi Prachii! I have a question about planning my trip to Dapoli/Harnai that wasn't in the FAQ.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 shadow-xs transition-all"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Ask Prachii on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
