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
      VALUES (NEW.customer_id, 'Job Completed ✅',
              COALESCE(worker_name, 'The worker') || ' has marked your ' || svc
                || ' job as completed. Please rate your experience!',
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