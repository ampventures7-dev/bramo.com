"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, MessageSquare, PhoneCall } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  faqs: FaqItem[];
  defaultOpenIndices?: number[];
  allowMultiple?: boolean;
  conciergePhone?: string;
}

export function FaqAccordion({
  faqs,
  defaultOpenIndices = [0], // Keep first question open by default so users see it's interactive
  allowMultiple = true,
  conciergePhone = "917447568595",
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

  return (
    <div className="space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openSet.has(idx);

        return (
          <div
            key={idx}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-2xs ${
              isOpen
                ? "border-konkan-teal-400/90 ring-1 ring-konkan-teal-400/30"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className="w-full p-4 sm:p-5 flex items-start justify-between gap-3 text-left transition-colors hover:bg-slate-50/70 select-none cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-konkan-teal-50 text-konkan-teal-800 border border-konkan-teal-200/60 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                  {faq.q}
                </h3>
              </div>

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-konkan-teal-800 bg-konkan-teal-50" : "bg-slate-100"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 animate-in fade-in-50 duration-200">
                <div className="pl-9 pr-2 pt-2 border-t border-slate-100">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed aeo-faq-answer">
                    {faq.a}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom Concierge Help Link */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium">
            Have a different question about road conditions, dolphin boats, or homestay food?
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
