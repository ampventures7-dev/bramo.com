# 🌊 bhramo.com — Hotel & Cottage Booking Platform

A coastal hotel and homestay booking platform built for **Dapoli** and **Harnai** in Maharashtra, India.

## 🚀 Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS (Coastal Konkan Palette: Teal, Sand, White)
- **Database, Auth & Storage:** Supabase (Free Tier) via `@supabase/supabase-js`
- **Maps:** Leaflet & OpenStreetMap (100% open-source, no paid API keys required)
- **Image Compression:** `browser-image-compression` (strictly enforces < 300 KB per photo for free-tier storage)
- **Date Range Picker:** `react-day-picker` with `date-fns`
- **Instant Messaging:** Direct `wa.me` links pre-filled with guest reservation details
- **Payments:** 0% commission direct payments — "Pay at Hotel" or "UPI QR with Manual Owner Confirmation"

---

## 📁 Folder Structure
```
HMS/
├── app/                  # Next.js 14 App Router pages & layout
│   ├── globals.css       # Tailwind CSS & theme definitions
│   ├── layout.tsx        # Shared layout with Navbar and Footer
│   ├── page.tsx          # Homepage with hero, search, & OpenStreetMap
│   ├── hotels/           # Hotel listings & individual detail pages
│   └── login/            # Supabase Auth guest & owner login
├── components/           # Reusable UI components (Navbar, Footer, LeafletMap, BookingModal, ImageUploader, HotelCard)
├── lib/                  # Utilities (supabase client, image compression, sample data)
├── types/                # TypeScript type definitions
└── .env.local            # Supabase configuration with placeholders
```

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
