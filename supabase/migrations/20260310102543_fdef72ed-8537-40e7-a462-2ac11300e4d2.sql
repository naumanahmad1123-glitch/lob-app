ALTER TABLE public.lobs ADD COLUMN IF NOT EXISTS location_name text;
ALTER TABLE public.lobs ADD COLUMN IF NOT EXISTS location_address text;
ALTER TABLE public.lobs ADD COLUMN IF NOT EXISTS location_lat double precision;
ALTER TABLE public.lobs ADD COLUMN IF NOT EXISTS location_lng double precision;