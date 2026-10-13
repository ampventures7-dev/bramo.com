export interface VoucherBookingData {
  id: string;
  hotelName: string;
  area: string;
  address: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  paymentMethod?: string;
  utr?: string;
  guestName: string;
  guestPhone: string;
  ownerWhatsapp?: string;
  status: string;
  createdAt?: string;
}

export function generateVoucherHtml(booking: VoucherBookingData): string {
  const formattedAdvance = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(booking.advancePaid);

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(booking.totalAmount);

  const formattedBalance = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(booking.balanceAmount);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Traveler Pass & Booking Voucher - ${booking.id}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #f8fafc;
    }
    .card {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #0f766e;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 26px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .box {
      background: #f1f5f9;
      padding: 12px;
      border-radius: 8px;
    }
    .box-title {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .box-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .hotel-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0 0 0;
      font-size: 16px;
      font-weight: 800;
      border-top: 2px dashed #cbd5e1;
      margin-top: 8px;
      color: #0f766e;
    }
    .offline-notice {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      border-radius: 8px;
      font-size: 11px;
      line-height: 1.5;
      color: #92400e;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="logo">bhramo<span style="color: #0d9488;">.com</span></div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Dapoli & Harnai Coastal Booking Network</div>
        <div style="font-size: 11px; color: #0f766e; font-weight: 600; margin-top: 4px;">OFFLINE TRAVELER PASS & CHECK-IN VOUCHER</div>
      </div>
      <div style="text-align: right;">
        <span class="badge">● ${booking.status.toUpperCase()}</span>
        <div style="font-family: monospace; font-size: 13px; font-weight: 700; margin-top: 6px;">ID: ${booking.id}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Check-in</div>
        <div class="box-value">${booking.checkIn}</div>
        <div style="font-size: 10px; color: #64748b;">From 12:00 PM</div>
      </div>
      <div class="box">
        <div class="box-title">Check-out</div>
        <div class="box-value">${booking.checkOut}</div>
        <div style="font-size: 10px; color: #64748b;">Until 10:00 AM</div>
      </div>
      <div class="box">
        <div class="box-title">Stay & Party</div>
        <div class="box-value">${booking.nights} Nights</div>
        <div style="font-size: 10px; color: #64748b;">${booking.guests} Guests</div>
      </div>
    </div>

    <div class="hotel-info">
      <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${booking.hotelName}</div>
      <div style="font-size: 13px; font-weight: 600; color: #0f766e; margin-top: 2px;">Room: ${booking.roomName}</div>
      <div style="font-size: 12px; color: #475569; margin-top: 4px;">📍 ${booking.address}, ${booking.area}</div>
      ${booking.ownerWhatsapp ? `<div style="font-size: 12px; color: #065f46; margin-top: 6px;">📞 Host WhatsApp: <strong>${booking.ownerWhatsapp}</strong></div>` : ""}
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">Guest & Payment Breakdown</div>
      <div class="price-row">
        <span>Lead Guest:</span>
        <strong>${booking.guestName} (${booking.guestPhone})</strong>
      </div>
      <div class="price-row">
        <span>Total Booking Amount:</span>
        <strong>${formattedTotal}</strong>
      </div>
      <div class="price-row" style="color: #047857;">
        <span>Advance Paid via Direct UPI:</span>
        <strong>${formattedAdvance}</strong>
      </div>
      ${booking.utr ? `<div class="price-row" style="font-family: monospace; font-size: 11px; color: #475569;">
        <span>Bank UTR Reference:</span>
        <span>${booking.utr}</span>
      </div>` : ""}
      <div class="total-row">
        <span>Payable at Check-in:</span>
        <span>${formattedBalance}</span>
      </div>
    </div>

    <div class="offline-notice">
      <strong>⚡ Konkan Coastal Offline Guarantee:</strong> Mobile data networks (Airtel/Jio) can experience weak signal around Ladghar and Murud cliffs. Keep this document downloaded or printed. Present this Booking ID upon arrival at the property reception.
    </div>

    <div class="no-print" style="margin-top: 24px; text-align: center;">
      <button onclick="window.print()" style="padding: 10px 24px; background: #0f766e; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
        Print / Save as PDF
      </button>
    </div>
  </div>
</body>
</html>`;
}

export function downloadVoucherFile(booking: VoucherBookingData): void {
  if (typeof window === "undefined") return;

  const html = generateVoucherHtml(booking);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bhramo-traveler-pass-${booking.id}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
