-- ==============================================================================
-- bhramo.com — Supabase Migration: Booking Transactions & 10-Minute Hold
-- Prevents double booking via atomic room decrement & auto-releases expired holds
-- ==============================================================================

-- 1. Add hold_expires_at column to bookings if not exists
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '10 minutes');

-- 2. Function to automatically release expired holds (> 10 mins without payment/confirmation)
CREATE OR REPLACE FUNCTION public.release_expired_holds()
RETURNS INT AS $$
DECLARE
  v_released_count INT := 0;
  v_rec RECORD;
  v_curr_date DATE;
BEGIN
  -- Find bookings that are still 'requested' but past their 10-minute hold window
  FOR v_rec IN
    SELECT id, room_type_id, check_in, check_out, guests
    FROM public.bookings
    WHERE status = 'requested'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at < timezone('utc'::text, now())
    FOR UPDATE
  LOOP
    -- Restore rooms in availability table
    v_curr_date := v_rec.check_in;
    WHILE v_curr_date < v_rec.check_out LOOP
      UPDATE public.availability
      SET rooms_available = rooms_available + 1
      WHERE room_type_id = v_rec.room_type_id
        AND date = v_curr_date;

      v_curr_date := v_curr_date + interval '1 day';
    END LOOP;

    -- Mark booking as cancelled due to timeout
    UPDATE public.bookings
    SET status = 'cancelled'
    WHERE id = v_rec.id;

    v_released_count := v_released_count + 1;
  END LOOP;

  RETURN v_released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atomic Booking Hold Creation Function (Prevents Double Booking)
-- Runs inside a database transaction: validates dates, checks inventory, decrements rooms_available
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
  -- Step 1: Release any already expired holds first
  PERFORM public.release_expired_holds();

  -- Step 2: Validate Dates
  IF p_check_in < CURRENT_DATE THEN
    RAISE EXCEPTION 'PAST_DATE: Check-in date cannot be in the past.';
  END IF;

  IF p_check_out <= p_check_in THEN
    RAISE EXCEPTION 'INVALID_DATES: Check-out date must be after check-in date.';
  END IF;

  IF p_rooms_count < 1 THEN
    RAISE EXCEPTION 'INVALID_ROOMS: At least 1 room must be requested.';
  END IF;

  -- Step 3: Fetch Room Type Details
  SELECT * INTO v_room_type
  FROM public.room_types
  WHERE id = p_room_type_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ROOM_NOT_FOUND: Selected room type does not exist.';
  END IF;

  IF p_guests > (v_room_type.capacity * p_rooms_count) THEN
    RAISE EXCEPTION 'CAPACITY_EXCEEDED: Number of guests exceeds room capacity.';
  END IF;

  -- Step 4: Check and Decrement Availability for each night in range
  v_curr_date := p_check_in;
  WHILE v_curr_date < p_check_out LOOP
    -- Lock row or insert default availability row if not present
    SELECT * INTO v_avail
    FROM public.availability
    WHERE room_type_id = p_room_type_id AND date = v_curr_date
    FOR UPDATE;

    IF NOT FOUND THEN
      -- Create initial availability row with default total_rooms
      INSERT INTO public.availability (room_type_id, date, rooms_available)
      VALUES (p_room_type_id, v_curr_date, v_room_type.total_rooms)
      RETURNING * INTO v_avail;
    END IF;

    -- Check if sufficient rooms remain
    IF v_avail.rooms_available < p_rooms_count THEN
      RAISE EXCEPTION 'SOLD_OUT: No rooms available for date % (available: %, requested: %).',
        v_curr_date, v_avail.rooms_available, p_rooms_count;
    END IF;

    -- Decrement available rooms
    UPDATE public.availability
    SET rooms_available = rooms_available - p_rooms_count
    WHERE room_type_id = p_room_type_id AND date = v_curr_date;

    v_curr_date := v_curr_date + interval '1 day';
  END LOOP;

  -- Step 5: Insert Booking with 10-minute hold window
  v_expires_at := timezone('utc'::text, now()) + interval '10 minutes';

  INSERT INTO public.bookings (
    guest_id,
    hotel_id,
    room_type_id,
    check_in,
    check_out,
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

-- 4. Function to Confirm Payment / Reservation
CREATE OR REPLACE FUNCTION public.confirm_booking(
  p_booking_id UUID,
  p_payment_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND: Booking with ID % not found.', p_booking_id;
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'HOLD_EXPIRED: The 10-minute hold for this reservation has expired.';
  END IF;

  UPDATE public.bookings
  SET
    status = 'confirmed',
    payment_id = COALESCE(p_payment_id, payment_id),
    hold_expires_at = NULL
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'confirmed',
    'booking_id', p_booking_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
