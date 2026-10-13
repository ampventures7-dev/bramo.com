import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Cancellation and Refund Policy | bhramo.com",
  description:
    "Transparent 48-Hour Cancellation & Refund Policy for hotel bookings in Dapoli & Harnai: 95% advance fee refund for >48h cancellations, 0% gateway fees.",
};

export default function CancellationPolicyPage() {
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
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Fair Guest Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Cancellation & Refund Policy
        </h1>
        <p className="text-xs text-slate-500">
          Simple, Transparent & Fair for Both Guests and Local Konkan Hosts
        </p>
      </div>

      {/* Policy Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>More than 48 Hours Before Check-in</span>
          </div>
          <div className="text-2xl font-black text-emerald-900">
            95% Refund of Advance Booking Fee
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            If you cancel more than 48 hours prior to your scheduled 12:00 PM check-in date, you will receive a <strong>95% refund</strong> of your advance booking fee. A nominal 5% administrative charge is retained. Any remaining balance payable at the hotel is waived and rooms are immediately released.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Within 48 Hours of Check-in</span>
          </div>
          <div className="text-2xl font-black text-amber-900">
            Non-Refundable Window
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Cancellations made within 48 hours of your scheduled check-in time are non-refundable, as local property owners hold rooms exclusively and turn away other travelers. However, the remaining balance payable at the hotel is completely waived.
          </p>
        </div>
      </div>

      {/* Detailed Guidelines */}
      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 space-y-6 leading-relaxed bg-white p-7 sm:p-9 rounded-3xl border border-konkan-sand-200 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">How to Cancel Your Reservation</h2>
          <p>
            You can cancel your booking directly from your guest dashboard:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Log in to your account and visit <Link href="/my-bookings" className="text-konkan-teal-700 font-bold hover:underline">/my-bookings</Link>.</li>
            <li>Locate your upcoming booking card and click <strong>Cancel Booking</strong>.</li>
            <li>The system will dynamically calculate your hours remaining until check-in and display your exact eligible refund amount.</li>
            <li>Select your reason and click <strong>Confirm Cancellation</strong>.</li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">How Refunds are Executed</h2>
          <p>
            Because bhramo.com operates with zero third-party payment gateways, all approved refunds are logged in our central platform ledger and executed via manual UPI transfer directly back to your original paying UPI ID / phone number within <strong>24 to 48 banking hours</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Host Rescheduling & Date Changes</h2>
          <p>
            If you need to change your dates rather than cancel, you may contact the property host directly via the WhatsApp link on your booking voucher. Many Konkan hosts gladly accommodate date changes based on seasonal room availability.
          </p>
        </section>
      </div>
    </div>
  );
}
