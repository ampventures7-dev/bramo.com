# 🌴 bhramo.com — Setup & Local Execution Guide

### 📋 Prerequisites
- **Node.js**: v18.17+ or v20+ recommended
- **Supabase Account**: (Free tier) for live Postgres DB, Auth, and Image Storage

---

### 🚀 Running the Project

1. **Verify Environment Variables (`.env.local`)**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-placeholder
   NEXT_PUBLIC_DEFAULT_WHATSAPP_PHONE=919876543210
   ```
   *Note: If kept as placeholders, the application runs seamlessly in local preview mode.*

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 🗺️ Open-Source Components
- **Leaflet & OpenStreetMap**: Interactive map configured for the Dapoli and Harnai coastline.
- **Image Compression**: `browser-image-compression` keeps photo uploads under 300 KB each.
- **Payments**: Direct "Pay at Hotel" or "UPI QR with 12-digit UTR confirmation".
- **WhatsApp Support**: Instant `wa.me` booking notifications to hotel owners.
