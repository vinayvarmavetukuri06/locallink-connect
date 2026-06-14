import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/user/history")({
  component: BookingHistory,
});

type Booking = {
  id: string;
  service: string | null;
  date: string | null;
  time: string | null;
  address: string | null;
  amount: number | null;
  status: string;
  created_at: string;
};

function BookingHistory() {
  const { t, tStatus } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const customerId =
    typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  async function load() {
    if (!customerId) { setLoading(false); return; }
    const { data } = await supabase
      .from("bookings")
      .select("id, service, date, time, address, amount, status, created_at")
      .eq("customer_id", customerId)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false });
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [customerId]);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <Link to="/user/profile"><ArrowLeft className="size-5" /></Link>
        <h1 className="font-serif text-2xl">{t("history.title")}</h1>
      </header>
      <section className="px-5 py-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">{t("history.empty")}</div>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm font-sans">{b.service ?? t("history.service")}</p>
                  <p className="text-[11px] text-muted-foreground">#{b.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${b.status === "completed" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {tStatus(b.status)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-3">
                <p>{b.address}</p>
                <div className="flex justify-between mt-2">
                  <span>{b.date} · {b.time}</span>
                  <span className="font-bold text-foreground">₹{b.amount ?? 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
