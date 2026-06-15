
-- Allow admin delete operations and realtime broadcasts for worker removal
DROP POLICY IF EXISTS worker_profiles_delete_all ON public.worker_profiles;
CREATE POLICY worker_profiles_delete_all ON public.worker_profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS profiles_delete_all ON public.profiles;
CREATE POLICY profiles_delete_all ON public.profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS reviews_delete_all ON public.reviews;
CREATE POLICY reviews_delete_all ON public.reviews FOR DELETE USING (true);

GRANT DELETE ON public.worker_profiles TO anon, authenticated;
GRANT DELETE ON public.profiles TO anon, authenticated;
GRANT DELETE ON public.reviews TO anon, authenticated;

-- Enable realtime for live worker disappearance on customer screens
ALTER TABLE public.worker_profiles REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'worker_profiles';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_profiles';
  END IF;
END $$;
