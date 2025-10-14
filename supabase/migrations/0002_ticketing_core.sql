-- Migration: ticketing core schema derived from docs/userflow.md
-- Ensures pgcrypto available for uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Utility trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name text,
      contact_phone text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  ';

  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.concerts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  ';

  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.concert_seat_categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      concert_id uuid NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
      name text NOT NULL,
      display_color text NOT NULL,
      price numeric(10,2) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  ';

  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.concert_seats (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      concert_id uuid NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
      category_id uuid NOT NULL REFERENCES public.concert_seat_categories(id) ON DELETE CASCADE,
      seat_label text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  ';

  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.favorite_concerts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      concert_id uuid NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  ';

  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.reservation_orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_number text NOT NULL UNIQUE,
      concert_id uuid NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
      user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT ''pending'',
      hold_expires_at timestamptz,
      confirmed_at timestamptz,
      booker_name text,
      booker_contact text,
      total_price numeric(12,2),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT reservation_orders_status_check CHECK (status IN (''pending'',''confirmed'',''cancelled'',''expired''))
    )
  ';

  EXECUTE '
    CREATE TABLE IF NOT EXISTS public.reservation_order_seats (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL REFERENCES public.reservation_orders(id) ON DELETE CASCADE,
      seat_id uuid NOT NULL REFERENCES public.concert_seats(id),
      price numeric(10,2) NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  ';

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- updated_at triggers
CREATE TRIGGER IF NOT EXISTS set_timestamp_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER IF NOT EXISTS set_timestamp_concerts
BEFORE UPDATE ON public.concerts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER IF NOT EXISTS set_timestamp_concert_seat_categories
BEFORE UPDATE ON public.concert_seat_categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER IF NOT EXISTS set_timestamp_concert_seats
BEFORE UPDATE ON public.concert_seats
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER IF NOT EXISTS set_timestamp_reservation_orders
BEFORE UPDATE ON public.reservation_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- indexes & constraints
CREATE UNIQUE INDEX IF NOT EXISTS favorite_concerts_user_concert_idx
  ON public.favorite_concerts (user_id, concert_id);

CREATE UNIQUE INDEX IF NOT EXISTS reservation_order_seats_active_seat_idx
  ON public.reservation_order_seats (seat_id)
  WHERE is_active;

-- disable RLS as per project guideline
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.concerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.concert_seat_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.concert_seats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorite_concerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservation_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservation_order_seats DISABLE ROW LEVEL SECURITY;
