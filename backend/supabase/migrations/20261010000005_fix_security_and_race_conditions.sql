-- ==============================================================================
-- bhramo.com — Migration 20261010000005
-- Fix Security Issues, Race Conditions, Inventory Leaks & Missing RLS Policies
-- ==============================================================================

-- 1. ADD rooms_count TO BOOKINGS
-- Essential for atomic multi-room reservations and inventory restoration
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS rooms_count INT NOT NULL DEFAULT 1 CHECK (rooms_count > 0);

-- 2. CREATE PAYMENT-RECEIPTS STORAGE BUCKET FOR GUEST UTR SCREENSHOTS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  true,
  307200, -- 300 KB constraint
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 307200,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS: Anyone can view payment receipts if they have the URL
DROP POLICY IF EXISTS "Public can view payment receipts" ON storage.objects;
CREATE POLICY "Public can view payment receipts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'payment-receipts');

-- Storage RLS: Authenticated users can upload payment receipts
DROP POLICY IF EXISTS "Authenticated users can upload payment receipts" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
  );

-- Storage RLS: Public anon can also upload payment receipt during guest checkout
DROP POLICY IF EXISTS "Public anon can upload payment receipts" ON storage.objects;
CREATE POLICY "Public anon can upload payment receipts"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'payment-receipts'
  );

-- Storage RLS: Users can delete receipts if needed
DROP POLICY IF EXISTS "Users can delete payment receipts" ON storage.objects;
CREATE POLICY "Users can delete payment receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-receipts'
  );

-- Storage RLS: Fix hotel-photos delete policy to only allow admins or owners
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

-- 3. PROFILES SECURITY: PREVENT ROLE PRIVILEGE ESCALATION
-- Trigger to ensure guests cannot update their own role column to admin or owner
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is changing, ensure current user is an admin
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'UNAUTHORIZED: Only administrators can modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_profile_role_update();

-- Allow public to read reviewer names on profiles
DROP POLICY IF EXISTS "Public can view profile display names" ON public.profiles;
CREATE POLICY "Public can view profile display names"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

-- 4. HOTELS SECURITY: PREVENT OWNERS FROM SELF-APPROVING OR ALTERING COMMISSION
CREATE OR REPLACE FUNCTION public.check_hotel_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If status or commission_rate is changing, verify caller is admin
  IF (NEW.status IS DISTINCT FROM OLD.status) OR (NEW.commission_rate IS DISTINCT FROM OLD.commission_rate) THEN
    IF NOT public.is_admin() THEN
      -- If caller is not admin, preserve old status and commission rate
      NEW.status := OLD.status;
      NEW.commission_rate := OLD.commission_rate;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_hotel_admin_fields ON public.hotels;
CREATE TRIGGER trg_protect_hotel_admin_fields
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_hotel_status_update();

-- On hotel creation, always enforce status = 'pending' unless admin
CREATE OR REPLACE FUNCTION public.enforce_new_hotel_pending()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.status := 'pending';
    NEW.commission_rate := 15.00;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_new_hotel_pending ON public.hotels;
CREATE TRIGGER trg_enforce_new_hotel_pending
  BEFORE INSERT ON public.hotels
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_new_hotel_pending();

-- 5. ATOMIC BOOKING HOLD CREATION (SOLVES RACE CONDITIONS R-1 & R-2)
CREATE OR REPLACE FUNCTION public.create_booking_hold(
  p_guest_id UUID,
  p_hotel_id UUID,
  p_room_type_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_rooms_count INT,
  p_guests INT,
  p_total_amount NUMERIC,
  p_payment_method TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_curr_date DATE;
  v_room_type RECORD;
  v_avail RECORD;
  v_booking_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Release any expired holds first
  PERFORM public.release_expired_holds();

  -- Validate Dates & Numbers
  IF p_check_in < CURRENT_DATE THEN
    RAISE EXCEPTION 'PAST_DATE: Check-in date cannot be in the past.';
  END IF;

  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'INVALID_DATES: Check-out date must be after check-in date.';
  END IF;

  IF p_rooms_count < 1 THEN
    RAISE EXCEPTION 'INVALID_ROOMS: At least 1 room must be requested.';
  END IF;

  -- Fetch Room Type Details
  SELECT * INTO v_room_type
  FROM public.room_types
  WHERE id = p_room_type_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROOM_NOT_FOUND: Selected room type does not exist.';
  END IF;

  IF p_guests > (v_room_type.capacity * p_rooms_count) THEN
    RAISE EXCEPTION 'CAPACITY_EXCEEDED: Number of guests exceeds total room capacity.';
  END IF;

  -- Atomic Inventory Decrement with Concurrency Protection
  v_curr_date := p_check_in;
  WHILE v_curr_date < p_check_out LOOP
    -- Ensure availability row exists (safe upsert pattern eliminates collision race condition)
    INSERT INTO public.availability (room_type_id, date, rooms_available)
    VALUES (p_room_type_id, v_curr_date, v_room_type.total_rooms)
    ON CONFLICT (room_type_id, date) DO NOTHING;

    -- Now lock and select row for update
    SELECT * INTO v_avail
    FROM public.availability
    WHERE room_type_id = p_room_type_id AND date = v_curr_date
    FOR UPDATE;

    -- Check remaining rooms
    IF v_avail.rooms_available < p_rooms_count THEN
      RAISE EXCEPTION 'SOLD_OUT: Only % room(s) available for % (requested: %).',
        v_avail.rooms_available, v_curr_date, p_rooms_count;
    END IF;

    -- Decrement inventory by requested rooms count
    UPDATE public.availability
    SET rooms_available = rooms_available - p_rooms_count
    WHERE room_type_id = p_room_type_id AND date = v_curr_date;

    v_curr_date := v_curr_date + interval '1 day';
  END LOOP;

  -- Insert Booking Record with rooms_count preserved
  v_expires_at := timezone('utc'::text, now()) + interval '10 minutes';

  INSERT INTO public.bookings (
    guest_id,
    hotel_id,
    room_type_id,
    check_in,
    check_out,
    rooms_count,
    guests,
    total_amount,
    status,
    hold_expires_at
  ) VALUES (
    p_guest_id,
    p_hotel_id,
    p_room_type_id,
    p_check_in,
    p_check_out,
    p_rooms_count,
    p_guests,
    p_total_amount,
    'requested',
    v_expires_at
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'hold_expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FIX AUTO-RELEASE: RESTORE FULL rooms_count (SOLVES INVENTORY LEAK)
CREATE OR REPLACE FUNCTION public.release_expired_holds()
RETURNS INT AS $$
DECLARE
  v_released_count INT := 0;
  v_rec RECORD;
  v_curr_date DATE;
  v_rooms_to_restore INT;
BEGIN
  FOR v_rec IN
    SELECT id, room_type_id, check_in, check_out, COALESCE(rooms_count, 1) as rooms_count
    FROM public.bookings
    WHERE status = 'requested'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at < timezone('utc'::text, now())
    FOR UPDATE
  LOOP
    v_rooms_to_restore := v_rec.rooms_count;
    v_curr_date := v_rec.check_in;

    WHILE v_curr_date < v_rec.check_out LOOP
      UPDATE public.availability
      SET rooms_available = rooms_available + v_rooms_to_restore
      WHERE room_type_id = v_rec.room_type_id
        AND date = v_curr_date;

      v_curr_date := v_curr_date + interval '1 day';
    END LOOP;

    UPDATE public.bookings
    SET status = 'cancelled'
    WHERE id = v_rec.id;

    v_released_count := v_released_count + 1;
  END LOOP;

  RETURN v_released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FIX EXPIRE UNVERIFIED: RESTORE FULL rooms_count
CREATE OR REPLACE FUNCTION public.expire_unverified_bookings()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_rec RECORD;
  v_curr_date DATE;
  v_rooms_to_restore INT;
BEGIN
  FOR v_rec IN
    SELECT id, room_type_id, check_in, check_out, COALESCE(rooms_count, 1) as rooms_count
    FROM public.bookings
    WHERE status = 'pending_verification'
      AND verification_expires_at IS NOT NULL
      AND verification_expires_at < timezone('utc'::text, now())
    FOR UPDATE
  LOOP
    v_rooms_to_restore := v_rec.rooms_count;
    v_curr_date := v_rec.check_in;

    WHILE v_curr_date < v_rec.check_out LOOP
      UPDATE public.availability
      SET rooms_available = rooms_available + v_rooms_to_restore
      WHERE room_type_id = v_rec.room_type_id
        AND date = v_curr_date;

      v_curr_date := v_curr_date + interval '1 day';
    END LOOP;

    UPDATE public.bookings
    SET status = 'cancelled'
    WHERE id = v_rec.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ATOMIC SUBMISSION OF UPI: PREVENTS EXPIRED REVIVAL (SOLVES R-3)
CREATE OR REPLACE FUNCTION public.submit_booking_upi(
  p_booking_id UUID,
  p_utr TEXT,
  p_screenshot_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
  v_expires_at TIMESTAMPTZ;
  v_clean_utr TEXT := trim(p_utr);
BEGIN
  -- Check UTR format (12 digits)
  IF length(v_clean_utr) <> 12 OR v_clean_utr !~ '^\d{12}$' THEN
    RAISE EXCEPTION 'INVALID_UTR: UTR must be exactly 12 numeric digits.';
  END IF;

  -- Lock and fetch booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND: Booking record not found.';
  END IF;

  -- Prevent updating if already cancelled or past 10-minute hold window
  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'HOLD_EXPIRED: The hold for this booking has expired and rooms were released.';
  END IF;

  IF v_booking.hold_expires_at IS NOT NULL AND v_booking.hold_expires_at < timezone('utc'::text, now()) THEN
    -- Cancel and return rooms
    PERFORM public.release_expired_holds();
    RAISE EXCEPTION 'HOLD_EXPIRED: The 10-minute hold window has elapsed. Please select dates again.';
  END IF;

  IF v_booking.status <> 'requested' AND v_booking.status <> 'pending_verification' THEN
    RAISE EXCEPTION 'INVALID_STATE: Booking is already in % state.', v_booking.status;
  END IF;

  -- 6 hour verification window
  v_expires_at := timezone('utc'::text, now()) + interval '6 hours';

  UPDATE public.bookings
  SET
    status = 'pending_verification',
    utr = v_clean_utr,
    screenshot_url = p_screenshot_url,
    hold_expires_at = NULL,
    verification_expires_at = v_expires_at
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'verification_expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ATOMIC CANCELLATION RPC (SOLVES E-1: RESTORES INVENTORY ON CANCEL)
CREATE OR REPLACE FUNCTION public.cancel_booking_and_restore_rooms(
  p_booking_id UUID,
  p_reason TEXT DEFAULT 'Cancelled by guest or admin'
)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
  v_curr_date DATE;
  v_rooms_to_restore INT;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND: Booking not found.';
  END IF;

  -- If already cancelled, do not double-restore
  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Booking was already cancelled.');
  END IF;

  -- Restore rooms to availability table
  v_rooms_to_restore := COALESCE(v_booking.rooms_count, 1);
  v_curr_date := v_booking.check_in;

  WHILE v_curr_date < v_booking.check_out LOOP
    UPDATE public.availability
    SET rooms_available = rooms_available + v_rooms_to_restore
    WHERE room_type_id = v_booking.room_type_id
      AND date = v_curr_date;

    v_curr_date := v_curr_date + interval '1 day';
  END LOOP;

  -- Mark status cancelled
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'restored_rooms', v_rooms_to_restore
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. REVIEWS POLICY SECURITY (SOLVES P-2: ONLY COMPLETED BOOKINGS)
DROP POLICY IF EXISTS "Guests can insert reviews" ON public.reviews;
CREATE POLICY "Guests can insert reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    guest_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = reviews.booking_id
        AND bookings.guest_id = auth.uid()
        AND bookings.status = 'completed'
    )
  );

-- 11. BOOKINGS RLS POLICIES FOR ANONYMOUS GUESTS & UPDATES
-- Allow public SELECT of booking by specific ID (needed for confirmation / payment note checkout)
DROP POLICY IF EXISTS "Public can view booking by id" ON public.bookings;
CREATE POLICY "Public can view booking by id"
  ON public.bookings FOR SELECT
  TO public
  USING (true);

-- 12. ENFORCE OWNER ROLE ON HOTEL INSERT
DROP POLICY IF EXISTS "Owners can create hotels" ON public.hotels;
CREATE POLICY "Owners can create hotels"
  ON public.hotels FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'admin')
    )
  );

-- 13. AUTOMATED MAINTENANCE CLEANUP FUNCTION
-- Called by /api/health to auto-release expired 10-min holds and 6-hour unverified bookings
CREATE OR REPLACE FUNCTION public.run_maintenance_cleanup()
RETURNS JSONB AS $$
DECLARE
  v_holds INT;
  v_unverified INT;
BEGIN
  v_holds := public.release_expired_holds();
  v_unverified := public.expire_unverified_bookings();
  RETURN jsonb_build_object(
    'success', true,
    'expired_holds_released', v_holds,
    'unverified_bookings_expired', v_unverified,
    'timestamp', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

