
CREATE OR REPLACE FUNCTION public.notify_on_booking_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  worker_user_id UUID;
  worker_name TEXT;
  customer_name TEXT;
  svc TEXT;
  dt TEXT;
  tm TEXT;
BEGIN
  SELECT wp.user_id, p.full_name INTO worker_user_id, worker_name
  FROM public.worker_profiles wp
  LEFT JOIN public.profiles p ON p.id = wp.user_id
  WHERE wp.id = NEW.worker_id;

  SELECT full_name INTO customer_name FROM public.profiles WHERE id = NEW.customer_id;

  svc := COALESCE(NEW.service, 'a service');
  dt  := COALESCE(NEW.date::text, 'the scheduled date');
  tm  := COALESCE(NEW.time, 'the scheduled time');

  IF worker_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, booking_id)
    VALUES (
      worker_user_id,
      'New Booking Request 🔔',
      'You have a new booking request from ' || COALESCE(customer_name, 'a customer')
        || ' for ' || svc || ' on ' || dt || ' at ' || tm,
      'booking_new',
      NEW.id
    );
  END IF;

  IF NEW.customer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, booking_id)
    VALUES (
      NEW.customer_id,
      'Booking Sent ✅',
      'Your booking request has been sent to ' || COALESCE(worker_name, 'the worker')
        || '. Waiting for confirmation.',
      'booking_sent',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  worker_user_id UUID;
  worker_name TEXT;
  svc TEXT;
  dt TEXT;
  tm TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT wp.user_id, p.full_name INTO worker_user_id, worker_name
    FROM public.worker_profiles wp
    LEFT JOIN public.profiles p ON p.id = wp.user_id
    WHERE wp.id = NEW.worker_id;

    svc := COALESCE(NEW.service, 'the service');
    dt  := COALESCE(NEW.date::text, 'the scheduled date');
    tm  := COALESCE(NEW.time, 'the scheduled time');

    IF NEW.status = 'accepted' AND NEW.customer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (NEW.customer_id, 'Booking Accepted 🎉',
              COALESCE(worker_name, 'The worker') || ' has accepted your booking for '
                || svc || ' on ' || dt || ' at ' || tm
                || '. They will arrive at your location on time.',
              'booking_accepted', NEW.id);
    ELSIF NEW.status IN ('rejected', 'declined') AND NEW.customer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (NEW.customer_id, 'Booking Declined ❌',
              COALESCE(worker_name, 'The worker') || ' is unavailable for your requested time. Please book another worker.',
              'booking_rejected', NEW.id);
    ELSIF NEW.status = 'in_progress' AND NEW.customer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (NEW.customer_id, 'Worker is on the way',
              COALESCE(worker_name, 'Your worker') || ' is on the way',
              'booking_in_progress', NEW.id);
    ELSIF NEW.status = 'completed' AND NEW.customer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (NEW.customer_id, 'Booking Completed ✅',
              'Your booking with ' || COALESCE(worker_name, 'the worker') || ' is completed',
              'booking_completed', NEW.id);
    ELSIF NEW.status = 'cancelled' AND worker_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, booking_id)
      VALUES (worker_user_id, 'Booking Cancelled',
              'A booking was cancelled by the customer',
              'booking_cancelled', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure realtime is enabled for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;
