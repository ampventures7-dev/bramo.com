# bhramo.com — Backend & Database Layer

This directory contains the database schemas, Supabase migrations, seed data, and architectural documentation for **bhramo.com**.

---

## Directory Structure

```
backend/
├── supabase/
│   ├── migrations/
│   │   ├── 20261010000000_create_bhramo_schema.sql             # Core tables: profiles, hotels, room_types, bookings, reviews
│   │   ├── 20261010000001_booking_transaction_and_holds.sql    # Atomic 10-minute hold reservation engine
│   │   ├── 20261010000002_manual_upi_verification_and_ledger.sql # Platform settings, ledger & manual UPI verification
│   │   ├── 20261010000003_add_commission_rate_to_hotels.sql     # Commission rate column and helper triggers
│   │   ├── 20261010000004_verify_all_rls_and_storage.sql       # Storage buckets and strict Row-Level Security (RLS)
│   │   └── 20261010000005_fix_security_and_race_conditions.sql # Maintenance cleanup RPC and inventory safeguards
│   └── seed.sql                                                # Pre-populated hotels, rooms, and images in Dapoli & Harnai
├── docs/                                                       # Testing checklists & QA guides
├── database-relational-schema.png                              # Database schema diagram
├── breach-resorts-e-r-diagram.drawio.png                       # Entity Relationship diagram
├── admin-panel-flowchart.drawio.png                            # Admin workflows
├── frontend-flowchart.drawio.png                               # Booking flow diagram
└── tech-stack.png                                              # Architecture stack diagram
```

---

## Database Management

- **Execute Migrations:** Open the [Supabase SQL Editor](https://supabase.com/dashboard) and run each `.sql` file in order.
- **Seed Data:** Run `seed.sql` to populate sample hotels in Dapoli & Harnai.
- **Wipe Test Data:** Run `TRUNCATE TABLE public.hotel_images, public.room_types, public.hotels CASCADE;` in the SQL Editor.
