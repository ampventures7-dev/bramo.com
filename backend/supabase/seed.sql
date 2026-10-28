-- ==============================================================================
-- bhramo.com — Database Reset / Clean State
-- ==============================================================================
-- Run the query below to wipe all mock/dummy seed data from your Supabase database:

TRUNCATE TABLE 
  public.reviews,
  public.room_images,
  public.room_types,
  public.bookings,
  public.ledger,
  public.hotels
CASCADE;

-- Real hotels, room types, and owner accounts will be added dynamically 
-- through the Owner Portal (/owner/dashboard) and Admin Portal (/admin).
