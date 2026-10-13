-- ==============================================================================
-- bhramo.com — Supabase Database Migration
-- Coastal Hotel Booking Platform (Dapoli & Harnai, Maharashtra)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE
-- Extends auth.users with custom roles and contact details
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to automatically create profile on auth.users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. HOTELS TABLE
-- Properties located in Dapoli or Harnai
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('Dapoli', 'Harnai')),
  address TEXT NOT NULL,
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  description TEXT,
  amenities TEXT[] DEFAULT '{}',
  checkin_time TEXT DEFAULT '12:00 PM',
  checkout_time TEXT DEFAULT '10:00 AM',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_hotels_area ON public.hotels(area);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON public.hotels(status);
CREATE INDEX IF NOT EXISTS idx_hotels_owner ON public.hotels(owner_id);

-- ==============================================================================
-- 3. ROOM TYPES TABLE
-- Individual room offerings per hotel
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_ac BOOLEAN NOT NULL DEFAULT false,
  capacity INT NOT NULL DEFAULT 2 CHECK (capacity > 0),
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  weekend_price NUMERIC(10, 2) NOT NULL CHECK (weekend_price >= 0),
  amenities TEXT[] DEFAULT '{}',
  total_rooms INT NOT NULL DEFAULT 1 CHECK (total_rooms > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_room_types_hotel ON public.room_types(hotel_id);

-- ==============================================================================
-- 4. ROOM IMAGES TABLE
-- Uploaded photos for room types and hotels (compressed < 300KB)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_room_images_room_type ON public.room_images(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_images_hotel ON public.room_images(hotel_id);

-- ==============================================================================
-- 5. AVAILABILITY TABLE
-- Track available room inventory and seasonal price overrides per date
-- Unique constraint on (room_type_id, date)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rooms_available INT NOT NULL DEFAULT 0 CHECK (rooms_available >= 0),
  price_override NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_availability_room_date UNIQUE (room_type_id, date)
);

CREATE INDEX IF NOT EXISTS idx_availability_lookup ON public.availability(room_type_id, date);

-- ==============================================================================
-- 6. BOOKINGS TABLE
-- Guest reservations with pay at hotel or UPI QR confirmation
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INT NOT NULL DEFAULT 1 CHECK (guests > 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  advance_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (advance_paid >= 0),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed')),
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_booking_dates CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_guest ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hotel ON public.bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_type ON public.bookings(room_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in, check_out);

-- ==============================================================================
-- 7. REVIEWS TABLE
-- Verified ratings and guest feedback (rating 1 to 5)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_hotel ON public.reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_guest ON public.reviews(guest_id);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone authenticated can view public profile details
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can edit their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- B. HOTELS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone (guests/anon/authenticated) can view approved hotels
CREATE POLICY "Anyone can view approved hotels"
  ON public.hotels FOR SELECT
  TO public
  USING (status = 'approved');

-- Owners can view all their own hotels (even pending or rejected)
CREATE POLICY "Owners can view own hotels"
  ON public.hotels FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Owners can insert and update their own hotels
CREATE POLICY "Owners can create hotels"
  ON public.hotels FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own hotels"
  ON public.hotels FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own hotels"
  ON public.hotels FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Admins can do everything on hotels
CREATE POLICY "Admins have full access to hotels"
  ON public.hotels FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- C. ROOM TYPES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view room types for approved hotels
CREATE POLICY "Anyone can view room types of approved hotels"
  ON public.room_types FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_types.hotel_id AND hotels.status = 'approved'
    )
  );

-- Owners can view room types for their own hotels
CREATE POLICY "Owners can view own room types"
  ON public.room_types FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

-- Owners can manage room types for their own hotels
CREATE POLICY "Owners can insert room types"
  ON public.room_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update room types"
  ON public.room_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete room types"
  ON public.room_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_types.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to room types"
  ON public.room_types FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- D. ROOM IMAGES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view room images for approved hotels
CREATE POLICY "Anyone can view images of approved hotels"
  ON public.room_images FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_images.hotel_id AND hotels.status = 'approved'
    )
  );

-- Owners can view, insert, update, delete images for their own hotels
CREATE POLICY "Owners can view own hotel images"
  ON public.room_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_images.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage own hotel images"
  ON public.room_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_images.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update own hotel images"
  ON public.room_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_images.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete own hotel images"
  ON public.room_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = room_images.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to room images"
  ON public.room_images FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- E. AVAILABILITY POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view availability for approved hotels
CREATE POLICY "Anyone can view availability of approved hotels"
  ON public.availability FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.room_types
      JOIN public.hotels ON hotels.id = room_types.hotel_id
      WHERE room_types.id = availability.room_type_id AND hotels.status = 'approved'
    )
  );

-- Owners can view and manage availability for their own hotels
CREATE POLICY "Owners can view own room availability"
  ON public.availability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_types
      JOIN public.hotels ON hotels.id = room_types.hotel_id
      WHERE room_types.id = availability.room_type_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage own room availability"
  ON public.availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_types
      JOIN public.hotels ON hotels.id = room_types.hotel_id
      WHERE room_types.id = availability.room_type_id AND hotels.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to availability"
  ON public.availability FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- F. BOOKINGS POLICIES
-- ------------------------------------------------------------------------------
-- Guests can see only their own bookings
CREATE POLICY "Guests can view only own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (guest_id = auth.uid());

-- Guests can create bookings for themselves
CREATE POLICY "Guests can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (guest_id = auth.uid());

-- Hotel owners can view bookings for their hotels
CREATE POLICY "Owners can view bookings for their hotels"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = bookings.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

-- Hotel owners can update bookings for their hotels (e.g. approve/confirm or update payment)
CREATE POLICY "Owners can update bookings for their hotels"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = bookings.hotel_id AND hotels.owner_id = auth.uid()
    )
  );

-- Admins have full access to all bookings
CREATE POLICY "Admins have full access to bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- G. REVIEWS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view reviews for approved hotels
CREATE POLICY "Anyone can view reviews of approved hotels"
  ON public.reviews FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels
      WHERE hotels.id = reviews.hotel_id AND hotels.status = 'approved'
    )
  );

-- Authenticated guests can create reviews for their bookings
CREATE POLICY "Guests can insert reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (guest_id = auth.uid());

-- Guests can update their own reviews
CREATE POLICY "Guests can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (guest_id = auth.uid());

-- Admins have full access to all reviews
CREATE POLICY "Admins have full access to reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_admin());
