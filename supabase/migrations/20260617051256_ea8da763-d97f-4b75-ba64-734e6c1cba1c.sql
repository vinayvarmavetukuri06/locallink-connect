
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;

CREATE OR REPLACE FUNCTION public.recalc_worker_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_worker UUID;
  avg_rating NUMERIC;
BEGIN
  target_worker := COALESCE(NEW.worker_id, OLD.worker_id);
  IF target_worker IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  SELECT AVG(rating) INTO avg_rating FROM public.reviews WHERE worker_id = target_worker;
  UPDATE public.worker_profiles
    SET rating = ROUND(COALESCE(avg_rating, 0)::numeric, 1)
    WHERE id = target_worker;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_worker_rating ON public.reviews;
CREATE TRIGGER trg_recalc_worker_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recalc_worker_rating();
