-- ==============================================================================
-- 100% ROW LEVEL SECURITY (RLS) AUDIT & STORAGE BUCKET POLICIES
-- Migration: 20261010000004_verify_all_rls_and_storage.sql
-- ==============================================================================

-- 1. Ensure RLS is active on EVERY table in public schema
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- 2. Platform Settings Policies (Public can read; Admins can edit)
DROP POLICY IF EXISTS "Public can view platform settings" ON public.platform_settings;
CREATE POLICY "Public can view platform settings"
  ON public.platform_settings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. Financial Ledger Policies (Admins only)
DROP POLICY IF EXISTS "Admins have full access to ledger" ON public.ledger;
CREATE POLICY "Admins have full access to ledger"
  ON public.ledger FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. Supabase Storage: Create and secure 'hotel-photos' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-photos',
  'hotel-photos',
  true,
  307200, -- 300 KB limit per file constraint
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 307200,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Anyone can view public hotel photos
DROP POLICY IF EXISTS "Public can view hotel photos" ON storage.objects;
CREATE POLICY "Public can view hotel photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'hotel-photos');

-- Storage RLS: Authenticated owners and admins can upload photos
DROP POLICY IF EXISTS "Owners and admins can upload hotel photos" ON storage.objects;
CREATE POLICY "Owners and admins can upload hotel photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hotel-photos' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
  );

-- Storage RLS: Owners and admins can delete their photos
DROP POLICY IF EXISTS "Owners and admins can delete hotel photos" ON storage.objects;
CREATE POLICY "Owners and admins can delete hotel photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hotel-photos' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
  );
