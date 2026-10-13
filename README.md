# 🌊 bhramo.com — Hotel & Cottage Booking Platform

A coastal hotel and homestay booking platform built for **Dapoli** and **Harnai** in Maharashtra, India.

---

## 📁 Repository Structure

```
HMS/
├── frontend/             # Next.js 14 App Router fullstack web application
│   ├── app/              # App Router routes, layouts, and API routes (/api/*)
│   ├── components/       # UI components (LeafletMap, HotelCard, BookingModal, etc.)
│   ├── context/          # React contexts (AuthContext, LanguageContext)
│   ├── lib/              # Services (Supabase client, booking service, rate limiter)
│   ├── types/            # TypeScript type declarations
│   ├── middleware.ts     # Edge security headers and route guards
│   ├── .env.local        # Local environment variables
│   └── package.json      # Frontend dependencies
├── backend/              # Database schemas, migrations, and architecture documentation
│   ├── supabase/         # SQL migrations and seed data
│   │   ├── migrations/   # Migration scripts (00 to 05)
│   │   └── seed.sql      # Seed hotels and rooms
│   └── docs/             # Technical docs, flowcharts, and ER diagrams
├── package.json          # Root monorepo workspace runner
└── README.md
```

---

## 🚀 Running Locally

From the root directory:

```bash
# Start local Next.js dev server
npm run dev

# Or directly inside the frontend folder:
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

---

## 🌐 Deploying to Vercel

When importing this repository into Vercel:
1. In the **General Settings**, set **Root Directory** to `frontend`.
2. Add your environment variables in Vercel **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_ENABLE_DEMO_AUTH` (optional: `true` for staging preview, `false` for production)
