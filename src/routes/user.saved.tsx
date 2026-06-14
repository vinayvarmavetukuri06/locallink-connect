import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchWorkerById, type RealWorker } from "@/lib/workers-api";
import { WorkerListCard } from "@/components/worker-card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/user/saved")({
  component: SavedWorkers,
});

function SavedWorkers() {
  const { t } = useI18n();
  const [workers, setWorkers] = useState<RealWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const customerId =
    typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  async function load() {
    if (!customerId) {
      setLoading(false);
      return;
    }
    const { data } = await (supabase as any)
      .from("saved_workers")
      .select("worker_id")
      .eq("customer_id", customerId);
    const ids: string[] = (data ?? []).map((r: any) => r.worker_id);
    const resolved = await Promise.all(ids.map((id) => fetchWorkerById(id)));
    setWorkers(resolved.filter((w): w is RealWorker => !!w));
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (!customerId) return;
    const channel = supabase
      .channel("saved-workers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_workers", filter: `customer_id=eq.${customerId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <Link to="/user/profile"><ArrowLeft className="size-5" /></Link>
        <h1 className="font-serif text-2xl">{t("saved.title")}</h1>
      </header>
      <section className="px-5 py-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : workers.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-3xl p-8 text-center">
            <Heart className="size-7 text-muted-foreground mx-auto mb-2" />
            <p className="font-bold text-sm font-sans">{t("saved.empty")}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{t("saved.emptySub")}</p>
            <Link to="/user" className="inline-flex bg-primary text-primary-foreground text-sm font-bold px-5 py-3 rounded-2xl">
              {t("saved.browse")}
            </Link>
          </div>
        ) : (
          workers.map((w) => <WorkerListCard key={w.id} worker={w} />)
        )}
      </section>
    </>
  );
}
