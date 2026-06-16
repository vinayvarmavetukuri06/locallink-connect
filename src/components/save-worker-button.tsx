import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export function SaveWorkerButton({
  workerId,
  className = "",
  size = "md",
}: {
  workerId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(false);
  const [, setRowId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const customerId =
    typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("saved_workers")
        .select("id")
        .eq("customer_id", customerId)
        .eq("worker_id", workerId)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setSaved(true);
        setRowId(data.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, workerId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!customerId || busy) return;
    setBusy(true);
    if (saved) {
      const { error } = await (supabase as any)
        .from("saved_workers")
        .delete()
        .eq("customer_id", customerId)
        .eq("worker_id", workerId);
      if (!error) {
        setSaved(false);
        setRowId(null);
      }
    } else {
      const { data, error } = await (supabase as any)
        .from("saved_workers")
        .insert({ customer_id: customerId, worker_id: workerId })
        .select("id")
        .maybeSingle();
      if (!error) {
        setSaved(true);
        setRowId(data?.id ?? null);
        setPop(true);
        setTimeout(() => setPop(false), 400);
      }
    }
    setBusy(false);
  }

  const dim = size === "sm" ? "size-8" : "size-9";
  const icon = size === "sm" ? "size-4" : "size-[18px]";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? t("worker.removeSave") : t("worker.save")}
      aria-pressed={saved}
      className={`${dim} rounded-full bg-card/90 backdrop-blur border border-border flex items-center justify-center shrink-0 ${className}`}
    >
      {busy ? (
        <Loader2 className={`${icon} animate-spin text-muted-foreground`} />
      ) : (
        <Heart
          className={`${icon} ${saved ? "text-red-500 fill-red-500" : "text-muted-foreground"} ${pop ? "animate-pop" : ""}`}
        />
      )}
    </button>
  );
}
