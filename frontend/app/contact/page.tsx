import type { Metadata } from "next";
import Link from "next/link";
import { PhoneCall, MessageSquare, Mail, MapPin, Clock, ArrowLeft } from "lucide-react";
import { getWhatsAppLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Us — Coastal Support & Host Inquiries | bhramo.com",
  description:
    "Get in touch with bhramo.com: Dedicated WhatsApp helpline, host onboarding support, and visitor assistance for Dapoli and Harnai, Maharashtra.",
};

export default function ContactPage() {
  const waHelpLink = getWhatsAppLink(
    "919876543210",
    "Hi bhramo.com team, I need assistance with a coastal hotel booking in Dapoli/Harnai."
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-konkan-sand-200 pb-6 space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-konkan-teal-700 hover:text-konkan-teal-900 font-bold mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-konkan-teal-700 uppercase tracking-widest">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Coastal Helpdesk</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Contact bhramo.com
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Direct Konkan support for guests, resort hosts, and homestay partners
        </p>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* WhatsApp Card */}
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Instant WhatsApp Support</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fastest response for urgent booking confirmations, dolphin safari boat queries, or local road directions to Dapoli and Harnai.
            </p>
            <div className="font-mono text-sm font-bold text-emerald-900 pt-1">
              +91 98765 43210
            </div>
          </div>

          <a
            href={waHelpLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* Email & Office Card */}
        <div className="bg-white border border-konkan-sand-200 p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-konkan-teal-50 border border-konkan-teal-200 text-konkan-teal-800 flex items-center justify-center">
              <Mail className="w-5 h-5 text-konkan-teal-700" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Email & Host Partnerships</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              For new hotel listings, homestay onboarding, billing, or media inquiries:
            </p>
            <div className="space-y-1.5 text-xs text-slate-700">
              <div><strong>General Support:</strong> support@bhramo.com</div>
              <div><strong>Host Onboarding:</strong> hosts@bhramo.com</div>
              <div className="flex items-center gap-1.5 text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-konkan-teal-600" />
                <span>Mon – Sun: 8:00 AM – 9:00 PM IST</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="w-4 h-4 text-konkan-teal-700 shrink-0" />
            <span>Coastal Desk: Dapoli Town, Ratnagiri District, Maharashtra 415712</span>
          </div>
        </div>
      </div>
    </div>
  );
}
