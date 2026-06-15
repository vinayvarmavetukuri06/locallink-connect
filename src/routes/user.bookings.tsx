import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, X, Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categorySlugFromService } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

type Booking = {
  id: string;
  customer_id: string | null;
  worker_id: string | null;
  service: string | null;
  date: string | null;
  time: string | null;
  address: string | null;
  problem_description: string | null;
  amount: number | null;
  status: string;
  created_at: string;
};


export const Route = createFileRoute("/user/bookings")({
  component: UserBookings,
});

function UserBookings() {
  const { t, tStatus } = useI18n();
  const TABS = [
    { key: "all", label: t("userBookings.tabAll") },
    { key: "pending", label: t("userBookings.tabPending") },
    { key: "accepted", label: t("userBookings.tabUpcoming") },
    { key: "in_progress", label: t("userBookings.tabActive") },
    { key: "completed", label: t("userBookings.tabCompleted") },
    { key: "cancelled", label: t("userBookings.tabCancelled") },
    { key: "declined", label: t("userBookings.tabDeclined") },
  ] as const;

  const [tab, setTab] = useState<string>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workerNames, setWorkerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("lc:dismissed-cancellations") ?? "[]")); }
    catch { return new Set(); }
  });

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("lc:dismissed-cancellations", JSON.stringify(Array.from(next)));
    }
  }

  async function load() {
    const customerId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;
    let q = supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (customerId) q = q.eq("customer_id", customerId);
    const { data, error } = await q;
    if (!error && data) {
      const list = data as Booking[];
      setBookings(list);
      const workerIds = Array.from(new Set(list.map((b) => b.worker_id).filter(Boolean))) as string[];
      if (workerIds.length) {
        const { data: wps } = await supabase
          .from("worker_profiles")
          .select("id, user_id")
          .in("id", workerIds);
        const userIds = (wps ?? []).map((w: any) => w.user_id).filter(Boolean);
        const { data: profs } = userIds.length
          ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
          : { data: [] as any[] };
        const profMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
        const map: Record<string, string> = {};
        (wps ?? []).forEach((w: any) => {
          map[w.id] = profMap.get(w.user_id) ?? "";
        });
        setWorkerNames(map);
      }
    }
    setLoading(false);
  }


  useEffect(() => {
    load();
    const channel = supabase
      .channel("user-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);
  const cancelledAlerts = bookings.filter((b) => b.status === "cancelled" && !dismissed.has(b.id));

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">{t("userBookings.title")}</h1>
      </header>

      {cancelledAlerts.length > 0 && (
        <div className="px-5 pt-4 space-y-3">
          {cancelledAlerts.map((b) => {
            const slug = categorySlugFromService(b.service);
            return (
              <div key={b.id} className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 relative">
                <button
                  onClick={() => dismiss(b.id)}
                  className="absolute top-3 right-3 text-destructive/70 hover:text-destructive"
                  aria-label={t("common.dismiss")}
                >
                  <X className="size-4" />
                </button>
                <div className="flex items-start gap-3 pr-6">
                  <div className="size-9 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm font-sans text-destructive">{t("userBookings.unavailable")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.service} · {b.date} · {b.time}
                    </p>
                    {slug ? (
                      <Link
                        to="/user/category/$slug"
                        params={{ slug }}
                        className="mt-3 inline-flex items-center gap-1 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        {t("userBookings.findAnother")}
                      </Link>
                    ) : (
                      <Link
                        to="/user"
                        className="mt-3 inline-flex items-center gap-1 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        {t("userBookings.findAnother")}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-5 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((tt) => (
          <button
            key={tt.key}
            onClick={() => setTab(tt.key)}
            className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap ${
              tab === tt.key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
            }`}
          >
            {tt.label}
          </button>
        ))}
      </div>

      <section className="px-5 py-5 space-y-3">
        {loading && (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">{t("userBookings.empty")}</div>
        )}
        {filtered.map((b) => {
          const map: Record<string, string> = {
            pending: "bg-warning/15 text-warning",
            accepted: "bg-primary/15 text-primary",
            in_progress: "bg-accent/20 text-accent-foreground",
            completed: "bg-success/15 text-success",
            declined: "bg-destructive/15 text-destructive",
            cancelled: "bg-destructive/15 text-destructive",
          };
          const cls = map[b.status] ?? "bg-secondary text-muted-foreground";
          const workerName = (b.worker_id && workerNames[b.worker_id]) || t("userBookings.unknownWorker");
          return (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-base font-sans truncate">{workerName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.service}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("userBookings.bookingId")}: #{b.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shrink-0 ${cls}`}>
                  {tStatus(b.status)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-3 space-y-1">
                {b.problem_description && <p className="line-clamp-2">{b.problem_description}</p>}
                <p><span className="font-semibold text-foreground">{t("userBookings.address")}:</span> {b.address ?? "—"}</p>
                <p><span className="font-semibold text-foreground">{t("userBookings.schedule")}:</span> {b.date} · {b.time}</p>
                <div className="flex justify-between pt-1">
                  <span className="font-semibold text-foreground">{t("userBookings.amount")}</span>
                  <span className="font-bold text-foreground">₹{b.amount ?? 0}</span>
                </div>
              </div>
            </div>
          );

        })}
      </section>
    </>
  );
}
