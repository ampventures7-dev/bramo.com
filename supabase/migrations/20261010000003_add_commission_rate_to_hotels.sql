-- ==============================================================================
-- ADD COMMISSION_RATE TO HOTELS & ADMIN PERMISSIONS
-- Migration: 20261010000003_add_commission_rate_to_hotels.sql
-- ==============================================================================

-- 1. Add commission_rate column to hotels table (default 15%)
ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100);

COMMENT ON COLUMN public.hotels.commission_rate IS 'Platform commission percentage earned on bookings for this hotel (default 15.00%).';

-- 2. Ensure RLS policies allow Admins to approve/reject hotels and update commission_rate
DROP POLICY IF EXISTS "Admins have full access to hotels" ON public.hotels;
CREATE POLICY "Admins have full access to hotels"
  ON public.hotels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. Ensure Admins have full access to view and update profiles (user management)
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
