-- ==============================================================================
-- bhramo.com — Enterprise Production Migration: Concurrency, Atomic Holds & Anti-Fraud
-- 1. Atomic Distributed Room Inventory Locking (Cross-Device Hold Management)
-- 2. Unique UTR Constraint to prevent double-spending & payment fraud
-- 3. Host Asynchronous Notification Audit Ledger with Action Tokens
-- ==============================================================================

-- 1. Anti-Fraud: Strict Unique Index on Active/Confirmed Bookings UTR
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_active_utr
ON public.bookings (utr)
WHERE status IN ('pending_verification', 'confirmed') AND utr IS NOT NULL;

-- 2. Enterprise Booking Holds Table
CREATE TABLE IF NOT EXISTS public.booking_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL UNIQUE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  rooms_count INT NOT NULL DEFAULT 1,
  guests_count INT NOT NULL DEFAULT 2,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'holding' CHECK (status IN ('holding', 'pending_verification', 'confirmed', 'released', 'expired')),
  hold_expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup of active holds during availability checks
CREATE INDEX IF NOT EXISTS idx_booking_holds_active_lookup
ON public.booking_holds (room_type_id, status, hold_expires_at, check_in, check_out);

-- 3. Function to automatically reap expired holds
CREATE OR REPLACE FUNCTION public.reap_expired_holds()
RETURNS INT AS $$
DECLARE
  v_reaped_count INT := 0;
BEGIN
  -- Mark booking holds as expired if they exceeded 15 minutes without payment
  UPDATE public.booking_holds
  SET status = 'expired',
      updated_at = timezone('utc'::text, now())
  WHERE status = 'holding'
    AND hold_expires_at < timezone('utc'::text, now());

  GET DIAGNOSTICS v_reaped_count = ROW_COUNT;

  -- Also cancel corresponding requested bookings past hold window
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = timezone('utc'::text, now())
  WHERE status = 'requested'
    AND hold_expires_at IS NOT NULL
    AND hold_expires_at < timezone('utc'::text, now());

  RETURN v_reaped_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atomic Hold Reservation Function with Row-Level Locking
CREATE OR REPLACE FUNCTION public.acquire_atomic_hold(
  p_booking_id TEXT,
  p_hotel_id UUID,
  p_room_type_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_rooms_count INT,
  p_guests_count INT,
  p_total_amount NUMERIC,
  p_guest_id UUID,
  p_guest_name TEXT,
  p_guest_phone TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_curr_date DATE;
  v_total_rooms INT;
  v_booked_rooms INT;
  v_held_rooms INT;
  v_available_rooms INT;
  v_hold_expires_at TIMESTAMPTZ;
BEGIN
  -- 1. Reap any expired holds before evaluating
  PERFORM public.reap_expired_holds();

  -- 2. Validate dates
  IF p_check_in < CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'PAST_DATE: Check-in date cannot be in the past.');
  END IF;

  IF p_check_out <= p_check_in THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_DATES: Check-out date must be after check-in date.');
  END IF;

  IF p_rooms_count < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ROOMS: At least 1 room required.');
  END IF;

  -- 3. Lock room type record to prevent concurrent allocation collisions
  SELECT total_rooms INTO v_total_rooms
  FROM public.room_types
  WHERE id = p_room_type_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND: Room type does not exist.');
  END IF;

  IF v_total_rooms IS NULL OR v_total_rooms < 1 THEN
    v_total_rooms := 5; -- default fallthrough capacity
  END IF;

  -- 4. Verify capacity for each night
  v_curr_date := p_check_in;
  WHILE v_curr_date < p_check_out LOOP
    -- Count confirmed bookings for date
    SELECT COALESCE(SUM(rooms_count), 0) INTO v_booked_rooms
    FROM public.bookings
    WHERE room_type_id = p_room_type_id
      AND status IN ('confirmed', 'pending_verification')
      AND check_in <= v_curr_date
      AND check_out > v_curr_date;

    -- Count active holds for date
    SELECT COALESCE(SUM(rooms_count), 0) INTO v_held_rooms
    FROM public.booking_holds
    WHERE room_type_id = p_room_type_id
      AND status = 'holding'
      AND hold_expires_at > timezone('utc'::text, now())
      AND check_in <= v_curr_date
      AND check_out > v_curr_date;

    v_available_rooms := v_total_rooms - (v_booked_rooms + v_held_rooms);

    IF v_available_rooms < p_rooms_count THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'SOLD_OUT: Room is no longer available on ' || v_curr_date::text || '. Only ' || GREATEST(0, v_available_rooms)::text || ' room(s) remaining.'
      );
    END IF;

    v_curr_date := v_curr_date + interval '1 day';
  END LOOP;

  -- 5. Availability confirmed: Insert atomic hold with 15-minute lease
  v_hold_expires_at := timezone('utc'::text, now()) + interval '15 minutes';

  INSERT INTO public.booking_holds (
    booking_id,
    hotel_id,
    room_type_id,
    guest_id,
    guest_name,
    guest_phone,
    check_in,
    check_out,
    rooms_count,
    guests_count,
    total_amount,
    status,
    hold_expires_at
  ) VALUES (
    p_booking_id,
    p_hotel_id,
    p_room_type_id,
    p_guest_id,
    p_guest_name,
    p_guest_phone,
    p_check_in,
    p_check_out,
    p_rooms_count,
    p_guests_count,
    p_total_amount,
    'holding',
    v_hold_expires_at
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'hold_expires_at', v_hold_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Host Asynchronous Notification Table
CREATE TABLE IF NOT EXISTS public.host_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms')),
  payload JSONB NOT NULL,
  action_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  delivery_status TEXT NOT NULL DEFAULT 'dispatched' CHECK (delivery_status IN ('dispatched', 'delivered', 'failed', 'confirmed')),
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_host_notifications_token ON public.host_notifications(action_token);
