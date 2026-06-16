
-- Add service_categories array column (keep existing service_category for backward compat).
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS service_categories text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill from existing single category.
UPDATE public.worker_profiles
SET service_categories = ARRAY[service_category]
WHERE service_category IS NOT NULL
  AND (service_categories IS NULL OR array_length(service_categories, 1) IS NULL);

-- Index to speed up category filtering.
CREATE INDEX IF NOT EXISTS worker_profiles_service_categories_gin
  ON public.worker_profiles USING gin (service_categories);
