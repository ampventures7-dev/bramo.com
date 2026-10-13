-- ==============================================================================
-- bhramo.com — Supabase Migration: Manual UPI Verification, Ledger & Settings
-- No payment gateway. Manual UPI verification with 6-hour timeout & ledger tracking
-- ==============================================================================

-- 1. Create Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  upi_id TEXT NOT NULL DEFAULT 'bhramo@upi',
  qr_image_url TEXT NOT NULL DEFAULT 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi%3A%2F%2Fpay%3Fpa%3Dbhramo%40upi%26pn%3Dbhramo.com',
  business_name TEXT NOT NULL DEFAULT 'bhramo.com',
  default_booking_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert default settings if not exists
INSERT INTO public.platform_settings (id, upi_id, qr_image_url, business_name, default_booking_fee_percent)
VALUES ('default', 'bhramo@upi', 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=upi%3A%2F%2Fpay%3Fpa%3Dbhramo%40upi%26pn%3Dbhramo.com', 'bhramo.com', 15.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Add booking_fee_percent to hotels table
ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS booking_fee_percent NUMERIC(5, 2) DEFAULT NULL;

-- 3. Update bookings table for manual verification & fee breakdown
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_fee_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS utr TEXT,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '6 hours');

-- Update status constraint to include 'pending_verification'
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('requested', 'pending_verification', 'confirmed', 'cancelled', 'completed'));

-- Unique index to reject duplicate UTRs (excluding nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_utr ON public.bookings(utr) WHERE utr IS NOT NULL;

-- 4. Create Ledger Table (Requirement 5)
CREATE TABLE IF NOT EXISTS public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('received', 'refund', 'payout')),
  amount NUMERIC(10, 2) NOT NULL,
  utr TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ledger_booking ON public.ledger(booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger(type);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON public.ledger(created_at);

-- 5. Auto-Expire Unverified Bookings After 6 Hours (Requirement 4)
CREATE OR REPLACE FUNCTION public.expire_unverified_bookings()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_rec RECORD;
  v_curr_date DATE;
BEGIN
  FOR v_rec IN
    SELECT id, room_type_id, check_in, check_out, guests
    FROM public.bookings
    WHERE status = 'pending_verification'
      AND verification_expires_at IS NOT NULL
      AND verification_expires_at < timezone('utc'::text, now())
    FOR UPDATE
  LOOP
    -- Return rooms to inventory
    v_curr_date := v_rec.check_in;
    WHILE v_curr_date < v_rec.check_out LOOP
      UPDATE public.availability
      SET rooms_available = rooms_available + 1
      WHERE room_type_id = v_rec.room_type_id
        AND date = v_curr_date;

      v_curr_date := v_curr_date + interval '1 day';
    END LOOP;

    -- Update booking status to cancelled
    UPDATE public.bookings
    SET status = 'cancelled'
    WHERE id = v_rec.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies for Ledger and Settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- Anyone can read platform settings (for UPI ID, QR, default fee)
CREATE POLICY "Public read platform settings"
  ON public.platform_settings FOR SELECT
  TO public
  USING (true);

-- Admins can update platform settings
CREATE POLICY "Admin manage platform settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Only Admins can view and manage ledger
CREATE POLICY "Admin full access to ledger"
  ON public.ledger FOR ALL
  TO authenticated
  USING (public.is_admin());
