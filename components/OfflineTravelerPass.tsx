"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
import {
  Waves,
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  Printer,
  X,
  Compass,
  AlertCircle,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles
} from "lucide-react";

export interface TravelerPassData {
  bookingId: string;
  hotelName: string;
  hotelArea: string;
  hotelAddress?: string;
  hostPhone?: string;
  roomName: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  roomsCount: number;
  guestsCount: number;
  totalAmount: number;
  advanceFeePaid: number;
  balanceAmount: number;
  utr?: string;
  status: string;
}

interface OfflineTravelerPassProps {
  data: TravelerPassData;
  onClose?: () => void;
}

export function OfflineTravelerPass({ data, onClose }: OfflineTravelerPassProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-konkan-sand-300 overflow-hidden print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Offline Check-in Pass
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-konkan-teal-700 hover:bg-konkan-teal-600 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Pass Body */}
        <div id="traveler-pass-content" className="p-6 sm:p-8 space-y-6 bg-white text-slate-800">
          {/* Header Card */}
          <div className="flex items-start justify-between border-b border-konkan-sand-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-konkan-teal-800 text-white flex items-center justify-center">
                  <Waves className="w-4 h-4 text-konkan-teal-200" />
                </div>
                <span className="font-black text-xl text-konkan-teal-950">
                  bhramo<span className="text-konkan-teal-600">.com</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Official Coastal Stay Voucher & Check-in Pass
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider border border-emerald-300">
                ● {data.status === "confirmed" ? "Verified & Confirmed" : "Hold Approved"}
              </span>
              <span className="block font-mono text-xs text-slate-400 font-bold mt-1">
                REF: {data.bookingId}
              </span>
            </div>
          </div>

          {/* Property & Host Landmark Box */}
          <div className="bg-konkan-sand-50 rounded-2xl p-4 border border-konkan-sand-200 space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-black text-slate-900">{data.hotelName}</h2>
              <span className="text-xs font-bold text-konkan-teal-800">📍 {data.hotelArea}, Dapoli</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {data.hotelAddress || `Beach Road, ${data.hotelArea}, Taluka Dapoli, Ratnagiri 415712`}
            </p>

            {data.hostPhone && (
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-700 font-medium">
                <Phone className="w-3.5 h-3.5 text-konkan-teal-700" />
                <span>Host Reception Contact: <strong>{data.hostPhone}</strong></span>
              </div>
            )}
          </div>

          {/* Reservation Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-y border-konkan-sand-200 py-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Guest Name</span>
              <strong className="text-slate-900 block truncate">{data.guestName}</strong>
              <span className="text-slate-500 text-[11px]">{data.guestPhone}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Room Category</span>
              <strong className="text-slate-900 block truncate">{data.roomName}</strong>
              <span className="text-slate-500 text-[11px]">{data.roomsCount} Room · {data.guestsCount} Guests</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-in</span>
              <strong className="text-slate-900 block">{data.checkIn}</strong>
              <span className="text-slate-500 text-[11px]">12:00 PM onwards</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-out</span>
              <strong className="text-slate-900 block">{data.checkOut}</strong>
              <span className="text-slate-500 text-[11px]">By 10:00 AM</span>
            </div>
          </div>

          {/* Financial Settlement Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Stay Charges:</span>
              <span className="font-bold text-slate-800">{formatINR(data.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-medium">
              <span>15% Advance Platform Fee Paid (UPI):</span>
              <span className="font-bold">- {formatINR(data.advanceFeePaid)}</span>
            </div>

            {data.utr && (
              <div className="text-[11px] text-slate-400 font-mono text-right">
                UTR: {data.utr}
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-950 block">
                  Balance Payable to Host at Reception:
                </span>
                <span className="text-[10px] text-amber-800">
                  To be settled in Cash or Host UPI upon arrival
                </span>
              </div>
              <span className="text-xl font-black text-amber-950">
                {formatINR(data.balanceAmount)}
              </span>
            </div>
          </div>

          {/* Offline Advice Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <Compass className="w-4 h-4 text-konkan-teal-700 shrink-0 mt-0.5" />
            <p>
              <strong>Konkan Travel Tip:</strong> Mobile network (Jio/Airtel) can be patchy around Murud, Ladghar, and Karde beaches. Take a screenshot or keep this PDF saved on your device for smooth offline check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
