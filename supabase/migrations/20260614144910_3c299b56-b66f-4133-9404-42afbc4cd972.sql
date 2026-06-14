CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  booking_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_all" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert_all" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_all" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "notifications_delete_all" ON public.notifications FOR DELETE USING (true);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: on new booking, notify the worker
CREATE OR REPLACE FUNCTION public.notify_on_booking_insert()
RETURNS TRIGGER AS $$
DECLARE
  worker_user_id UUID;
  customer_name TEXT;
BEGIN
  SELECT user_id INTO worker_user_id FROM public.worker_profiles WHERE id = NEW.worker_id;
  SELECT full_name INTO customer_name FROM public.profiles WHERE id = NEW.customer_id;
  IF worker_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, booking_id)
    VALUES (
      worker_user_id,
      'New booking request',
      'New booking request from ' || COALESCE(customer_name, 'a customer') || ' for ' || COALESCE(NEW.service, 'a service'),
      'booking_new',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_on_booking_insert
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_insert();

-- Trigger: on booking status change, notify the relevant party
CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  worker_user_id UUID;
  worker_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT wp.user_id, p.full_name INTO worker_user_id, worker_name
    FROM public.worker_profiles wp
    LEFT JOIN public.profiles p ON p.id = wp.user_id
    WHERE wp.id = NEW.worker_id;

    IF NEW.status = 'accepted' AND NEW.customer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (NEW.customer_id, 'Booking accepted',
              'Your booking with ' || COALESCE(worker_name, 'the worker') || ' has been accepted',
              'booking_accepted', NEW.id);
    ELSIF NEW.status = 'in_progress' AND NEW.customer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (NEW.customer_id, 'Worker is on the way',
              COALESCE(worker_name, 'Your worker') || ' is on the way',
              'booking_in_progress', NEW.id);
    ELSIF NEW.status = 'completed' AND NEW.customer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (NEW.customer_id, 'Booking completed',
              'Your booking with ' || COALESCE(worker_name, 'the worker') || ' is completed',
              'booking_completed', NEW.id);
    ELSIF NEW.status = 'cancelled' AND worker_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (worker_user_id, 'Booking cancelled',
              'A booking was cancelled by the customer',
              'booking_cancelled', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_notify_on_booking_status_change
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_status_change();