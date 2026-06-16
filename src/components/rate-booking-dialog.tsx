import { useState } from "react";
import { Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type Props = {
  open: boolean;
  bookingId: string;
  workerId: string | null;
  customerId: string | null;
  workerName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function RateBookingDialog({ open, bookingId, workerId, customerId, workerName, onClose, onSubmitted }: Props) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit() {
    if (rating < 1) {
      toast.error(t("rate.selectStars"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      worker_id: workerId,
      customer_id: customerId,
      rating,
      comment: comment.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(t("rate.submitFailed"));
      return;
    }
    toast.success(t("rate.thanks"));
    onSubmitted?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-backdrop-in">
      <div className="bg-card w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-8 relative animate-sheet-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground" aria-label={t("common.close")}>
          <X className="size-5" />
        </button>
        <h2 className="font-serif text-xl">{t("rate.title")}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {workerName ? `${t("rate.subtitle")} ${workerName}` : t("rate.subtitle")}
        </p>
        <div className="flex justify-center gap-2 my-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
              className="p-1"
            >
              <Star className={`size-8 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("rate.commentPh")}
          rows={3}
          className="w-full text-sm bg-secondary rounded-xl p-3 border-0 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 text-sm font-bold rounded-xl bg-secondary disabled:opacity-50"
          >
            {t("rate.skip")}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            {busy ? "…" : t("rate.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
