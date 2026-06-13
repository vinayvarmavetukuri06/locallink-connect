import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categorySlugFromService } from "@/lib/mock-data";

type Booking = {
  id: string;
  customer_id: string | null;
  service: string | null;
  date: string | null;
  time: string | null;
  address: string | null;
  problem_description: string | null;
  amount: number | null;
  status: string;
  created_at: string;
};

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Upcoming" },
  { key: "in_progress", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
] as const;

export const Route = createFileRoute("/user/bookings")({
  component: UserBookings,
});

function UserBookings() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const customerId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;
    let q = supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (customerId) q = q.eq("customer_id", customerId);
    const { data, error } = await q;
    if (!error && data) setBookings(data as Booking[]);
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

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">My Bookings</h1>
      </header>

      <div className="px-5 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap ${
              tab === t.key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="px-5 py-5 space-y-3">
        {loading && (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">No bookings yet.</div>
        )}
        {filtered.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-sm font-sans">{b.service}</p>
                <p className="text-[11px] text-muted-foreground">#{b.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <StatusPill status={b.status} />
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              <p className="line-clamp-2">{b.problem_description ?? "—"}</p>
              <p className="mt-1">{b.address}</p>
              <div className="flex justify-between mt-2">
                <span>{b.date} · {b.time}</span>
                <span className="font-bold text-foreground">₹{b.amount ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-warning/15 text-warning" },
    accepted: { label: "Accepted", cls: "bg-primary/15 text-primary" },
    in_progress: { label: "In Progress", cls: "bg-accent/20 text-accent-foreground" },
    completed: { label: "Completed", cls: "bg-success/15 text-success" },
    declined: { label: "Declined", cls: "bg-destructive/15 text-destructive" },
    cancelled: { label: "Cancelled", cls: "bg-destructive/15 text-destructive" },
  };
  const m = map[status] ?? { label: status, cls: "bg-secondary text-muted-foreground" };
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  );
}
