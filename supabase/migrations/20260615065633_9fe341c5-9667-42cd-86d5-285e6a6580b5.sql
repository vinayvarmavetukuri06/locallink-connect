
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select_all ON public.messages FOR SELECT USING (true);
CREATE POLICY messages_insert_all ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY messages_update_all ON public.messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY messages_delete_all ON public.messages FOR DELETE USING (true);

CREATE INDEX messages_pair_idx ON public.messages (sender_id, receiver_id, created_at DESC);
CREATE INDEX messages_receiver_unread_idx ON public.messages (receiver_id, is_read);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
