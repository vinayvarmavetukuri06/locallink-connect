import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/user/reviews")({
  component: MyReviews,
});

type Review = {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  worker_id: string | null;
};

function MyReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [workerNames, setWorkerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const customerId =
    typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  async function load() {
    if (!customerId) { setLoading(false); return; }
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, worker_id")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as Review[];
    setReviews(rows);

    const workerIds = Array.from(new Set(rows.map((r) => r.worker_id).filter(Boolean) as string[]));
    if (workerIds.length) {
      const { data: wps } = await supabase
        .from("worker_profiles")
        .select("id, user_id")
        .in("id", workerIds);
      const userIds = (wps ?? []).map((w: any) => w.user_id).filter(Boolean);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const profMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
      const map: Record<string, string> = {};
      for (const wp of wps ?? []) {
        map[(wp as any).id] = profMap.get((wp as any).user_id) ?? "Worker";
      }
      setWorkerNames(map);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [customerId]);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <Link to="/user/profile"><ArrowLeft className="size-5" /></Link>
        <h1 className="font-serif text-2xl">My Reviews</h1>
      </header>
      <section className="px-5 py-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">You haven't written any reviews yet.</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm font-sans">{r.worker_id ? workerNames[r.worker_id] ?? "Worker" : "Worker"}</p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3.5 ${i < (r.rating ?? 0) ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{r.comment ?? "—"}</p>
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </section>
    </>
  );
}
