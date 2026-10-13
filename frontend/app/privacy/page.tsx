import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | bhramo.com",
  description:
    "Privacy Policy for bhramo.com: How we handle your contact details, booking information, and manual UPI transaction verification in Dapoli & Harnai.",
};

export default function PrivacyPage() {
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
          <Lock className="w-3.5 h-3.5" />
          <span>Data Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500">
          Last Updated: October 2026 · Committed to Guest Confidentiality
        </p>
      </div>

      {/* Content */}
      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 space-y-6 leading-relaxed bg-white p-7 sm:p-9 rounded-3xl border border-konkan-sand-200 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            When you create an account, hold a room, or confirm a booking on bhramo.com, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Contact Data:</strong> Full name, phone number, and optional email address.</li>
            <li><strong>Stay Details:</strong> Selected check-in and check-out dates, room type, and number of guests.</li>
            <li><strong>Manual Payment Audit Information:</strong> 12-digit UPI UTR number and optional compressed receipt screenshots submitted for payment verification.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">2. How We Use Your Information</h2>
          <p>
            Your information is used solely to facilitate your coastal stay reservation:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Generating official booking confirmation vouchers.</li>
            <li>Connecting you directly with the property host via WhatsApp for arrival coordination.</li>
            <li>Verifying the advance booking fee via manual bank UTR audit.</li>
            <li>Enforcing duplicate booking prevention and rate limiting.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Zero Third-Party Advertising & Tracking</h2>
          <p>
            We do not sell, rent, or trade your personal data to any external advertising agencies or marketing brokers. We do not use third-party behavioral tracking cookies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">4. Payment Security (No Payment Gateway)</h2>
          <p>
            bhramo.com does not collect or store debit card numbers, credit card CVVs, or bank net banking passwords. All advance payments take place externally within your personal UPI app (GPay, PhonePe, Paytm, BHIM) directly to our verified platform UPI ID.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">5. Your Data Rights</h2>
          <p>
            You have the right to request access to your booking records or request deletion of your account profile at any time by writing to <span className="font-semibold text-konkan-teal-800">privacy@bhramo.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
