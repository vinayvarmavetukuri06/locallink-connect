
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  mobile text UNIQUE,
  location text,
  role text CHECK (role IN ('customer','worker')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_all" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_all" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.worker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_category text,
  years_of_experience integer,
  hourly_rate numeric,
  bio text,
  status text NOT NULL DEFAULT 'pending',
  rating numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.worker_profiles TO anon, authenticated;
GRANT ALL ON public.worker_profiles TO service_role;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "worker_profiles_select_all" ON public.worker_profiles FOR SELECT USING (true);
CREATE POLICY "worker_profiles_insert_all" ON public.worker_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "worker_profiles_update_all" ON public.worker_profiles FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES public.worker_profiles(id) ON DELETE SET NULL,
  service text,
  date date,
  time text,
  address text,
  problem_description text,
  status text NOT NULL DEFAULT 'pending',
  amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select_all" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "bookings_insert_all" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_update_all" ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid,
  worker_id uuid,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_all" ON public.reviews FOR INSERT WITH CHECK (true);
