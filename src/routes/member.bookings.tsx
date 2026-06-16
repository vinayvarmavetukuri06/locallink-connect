import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, MapPin, Loader2, CircleCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

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

type Profile = { id: string; full_name: string | null; mobile: string | null };

export const Route = createFileRoute("/member/bookings")({
  component: MemberBookings,
});

function MemberBookings() {
  const { t } = useI18n();
  const TABS = [
    { key: "pending", label: t("memberBookings.tabNew") },
    { key: "accepted", label: t("memberBookings.tabUpcoming") },
    { key: "in_progress", label: t("memberBookings.tabActive") },
    { key: "completed", label: t("memberBookings.tabDone") },
    { key: "cancelled", label: t("memberBookings.tabCancelled") },
    { key: "declined", label: t("memberBookings.tabDeclined") },
  ] as const;

  const [tab, setTab] = useState<string>("pending");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setBookings(data as Booking[]);
      const ids = Array.from(new Set(data.map((b) => b.customer_id).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, mobile")
          .in("id", ids);
        if (profs) {
          const map: Record<string, Profile> = {};
          profs.forEach((p) => { map[p.id] = p as Profile; });
          setCustomers(map);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("member-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      console.error(error);
      load();
    }
    setUpdatingId(null);
  }

  const filtered = bookings.filter((b) => b.status === tab);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">{t("memberBookings.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("memberBookings.subtitle")}</p>
      </header>

      <div className="px-5 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((tt) => {
          const count = bookings.filter((b) => b.status === tt.key).length;
          return (
            <button
              key={tt.key}
              onClick={() => setTab(tt.key)}
              className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap ${
                tab === tt.key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
              }`}
            >
              {tt.label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      <section className="px-5 py-5 space-y-3">
        {loading && (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">{t("memberBookings.empty")}</div>
        )}
        {filtered.map((b) => {
          const cust = b.customer_id ? customers[b.customer_id] : null;
          const name = cust?.full_name ?? t("memberHome.customer");
          const mobile = cust?.mobile ?? "—";
          return (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm font-sans">{name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="size-3" /> {mobile}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3" /> {b.address ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-primary block">₹{b.amount ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground">{b.service}</span>
                </div>
              </div>
              <div className="mt-3 bg-secondary rounded-xl p-3">
                <p className="text-xs">{b.problem_description ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{b.date} · {b.time}</p>
              </div>

              {b.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button
                    disabled={updatingId === b.id}
                    onClick={() => updateStatus(b.id, "declined")}
                    className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground disabled:opacity-60"
                  >
                    {t("memberBookings.decline")}
                  </button>
                  <button
                    disabled={updatingId === b.id}
                    onClick={() => updateStatus(b.id, "accepted")}
                    className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-success text-success-foreground disabled:opacity-60"
                  >
                    {t("memberBookings.accept")}
                  </button>
                </div>
              )}
              {b.status === "accepted" && (
                <div className="space-y-2 mt-3">
                  <button
                    onClick={() => setCompleteId(b.id)}
                    className="w-full py-2.5 text-xs font-bold rounded-xl bg-success text-success-foreground flex items-center justify-center gap-1.5"
                  >
                    <CircleCheck className="size-3.5" /> {t("memberBookings.markComplete")}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(b.id, "cancelled")}
                      className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={() => updateStatus(b.id, "in_progress")}
                      className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground"
                    >
                      {t("memberBookings.markInProgress")}
                    </button>
                  </div>
                </div>
              )}
              {b.status === "in_progress" && (
                <div className="space-y-2 mt-3">
                  <button
                    onClick={() => setCompleteId(b.id)}
                    className="w-full py-2.5 text-xs font-bold rounded-xl bg-success text-success-foreground flex items-center justify-center gap-1.5"
                  >
                    <CircleCheck className="size-3.5" /> {t("memberBookings.markComplete")}
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="w-full py-2.5 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              )}
              {b.status === "completed" && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success bg-success/15 px-2.5 py-1 rounded-full">
                    <CircleCheck className="size-3.5" /> {t("memberBookings.completed")}
                  </span>
                  <span className="text-xs font-bold text-success">
                    {t("memberBookings.earned")}: ₹{Number(b.amount ?? 0).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <ConfirmDialog
        open={completeId !== null}
        title={t("memberBookings.confirmCompleteTitle")}
        message={t("memberBookings.confirmCompleteMsg")}
        confirmLabel={t("common.confirm")}
        confirmVariant="success"
        busy={updatingId === completeId}
        onCancel={() => setCompleteId(null)}
        onConfirm={async () => {
          if (!completeId) return;
          const id = completeId;
          setUpdatingId(id);
          const { error } = await supabase.from("bookings").update({ status: "completed" }).eq("id", id);
          setUpdatingId(null);
          setCompleteId(null);
          if (error) {
            toast.error(t("memberBookings.completeFailed"));
            return;
          }
          setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: "completed" } : b)));
        }}
      />
    </>
  );
}
