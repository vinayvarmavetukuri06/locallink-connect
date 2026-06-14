CREATE TABLE public.saved_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  worker_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (customer_id, worker_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_workers TO anon, authenticated;
GRANT ALL ON public.saved_workers TO service_role;
ALTER TABLE public.saved_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_workers_select_all" ON public.saved_workers FOR SELECT USING (true);
CREATE POLICY "saved_workers_insert_all" ON public.saved_workers FOR INSERT WITH CHECK (true);
CREATE POLICY "saved_workers_delete_all" ON public.saved_workers FOR DELETE USING (true);
CREATE INDEX idx_saved_workers_customer ON public.saved_workers(customer_id);