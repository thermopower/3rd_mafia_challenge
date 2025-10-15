-- Migration: Add concert detail fields for UC-002
-- Adds necessary metadata fields to concerts table

DO $$
BEGIN
  -- Add additional columns to concerts table for detail page
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'artist'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN artist text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'venue_name'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN venue_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'venue_address'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN venue_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN end_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN duration_minutes integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'age_rating'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN age_rating text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'notice'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN notice text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN thumbnail_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concerts'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.concerts ADD COLUMN status text DEFAULT 'ON_SALE';
  END IF;

  -- Add status constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'concerts_status_check'
  ) THEN
    ALTER TABLE public.concerts
    ADD CONSTRAINT concerts_status_check
    CHECK (status IN ('ON_SALE', 'CLOSE_SOON', 'SOLD_OUT', 'ENDED'));
  END IF;

  -- Add description column to seat categories
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concert_seat_categories'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.concert_seat_categories ADD COLUMN description text;
  END IF;

  -- Add total_seats column to seat categories
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'concert_seat_categories'
    AND column_name = 'total_seats'
  ) THEN
    ALTER TABLE public.concert_seat_categories ADD COLUMN total_seats integer DEFAULT 0;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
