import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms and Conditions | bhramo.com",
  description:
    "Official terms and conditions governing room reservations, host direct communication, and platform usage for bhramo.com in Dapoli & Harnai, Maharashtra.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
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
          <FileText className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Terms & Conditions
        </h1>
        <p className="text-xs text-slate-500">
          Effective Date: October 2026 · Governing bhramo.com Coastal Network
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 space-y-6 leading-relaxed bg-white p-7 sm:p-9 rounded-3xl border border-konkan-sand-200 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Nature of the Platform</h2>
          <p>
            bhramo.com acts as a curated coastal discovery and direct connection platform for verified homestays, cottages, and beach resorts located in Dapoli and Harnai, Maharashtra, India. We connect guests directly with local Konkan property owners.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Reservation Holds & Manual UPI Payments</h2>
          <p>
            When booking through bhramo.com, guests pay an advance platform booking fee (typically 15% of the total amount) via direct UPI to secure the room reservation hold. The remaining balance amount is payable directly to the property host upon arrival at the hotel front desk via cash or UPI.
          </p>
          <p>
            Guests are required to submit an accurate 12-digit UTR (Unique Transaction Reference) transaction ID. Duplicate, invalid, or fraudulent UTR submissions will result in immediate cancellation of the booking hold.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Check-in Requirements & ID Verification</h2>
          <p>
            In accordance with local regulations in Maharashtra, all guests must present valid Government-issued photo identification (Aadhaar Card, Voter ID, Passport, or Driving License) upon arrival at the hotel. Failure to present valid ID may result in denial of check-in without refund.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">4. Cancellations & Refunds</h2>
          <p>
            All cancellations are subject to our transparent 48-Hour Cancellation Policy. Cancellations made more than 48 hours prior to check-in are eligible for a 95% refund of the advance booking fee (with a 5% administrative charge retained). Cancellations within 48 hours of check-in are non-refundable.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">5. Limitation of Liability</h2>
          <p>
            bhramo.com does not own or operate hotel facilities directly. Property owners are solely responsible for property maintenance, cleanliness, meals, and guest safety.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">6. Contact for Legal Inquiries</h2>
          <p>
            For any inquiries regarding these terms, please contact our support desk via email at <span className="font-semibold text-konkan-teal-800">support@bhramo.com</span> or on WhatsApp at <span className="font-semibold text-konkan-teal-800">+91 98765 43210</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
