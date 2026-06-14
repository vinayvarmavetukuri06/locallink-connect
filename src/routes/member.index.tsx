import { createFileRoute } from "@tanstack/react-router";
import {
  IndianRupee,
  Calendar,
  TrendingUp,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categoryBySlug } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/member/")({
  component: MemberHome,
});

type WorkerInfo = {
  userId: string;
  rowId: string | null;
  name: string;
  category: string;
  trade: string;
  area: string;
  isAvailable: boolean;
};

type BookingRow = {
  id: string;
  customer_id: string | null;
  service: string | null;
  address: string | null;
  date: string | null;
  time: string | null;
  amount: number | null;
  status: string;
  problem_description: string | null;
  created_at: string;
  customer_name?: string;
};

function MemberHome() {
  const workerUserId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [workerRowId, setWorkerRowId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorker = useCallback(async () => {
    if (!workerUserId) return;
    const [{ data: profile }, { data: wp }] = await Promise.all([
      supabase.from("profiles").select("full_name, location").eq("id", workerUserId).maybeSingle(),
      supabase
        .from("worker_profiles")
        .select("id, service_category, is_available")
        .eq("user_id", workerUserId)
        .maybeSingle(),
    ]);
    const slug = wp?.service_category ?? "";
    setWorkerRowId(wp?.id ?? null);
    if (wp?.id && typeof window !== "undefined") {
      localStorage.setItem("lc:worker-id", wp.id);
    }
    setWorker({
      userId: workerUserId,
      rowId: wp?.id ?? null,
      name: profile?.full_name ?? "Worker",
      category: slug,
      trade: categoryBySlug(slug)?.name ?? slug ?? "Service Pro",
      area: profile?.location ?? "",
      isAvailable: wp?.is_available ?? true,
    });
  }, [workerUserId]);

  const loadBookings = useCallback(async (rowId: string | null) => {
    if (!rowId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("bookings")
      .select("id, customer_id, service, address, date, time, amount, status, problem_description, created_at")
      .eq("worker_id", rowId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as BookingRow[];
    const customerIds = Array.from(new Set(rows.map((r) => r.customer_id).filter(Boolean) as string[]));
    if (customerIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", customerIds);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
      rows.forEach((r) => {
        r.customer_name = (r.customer_id && map.get(r.customer_id)) || "Customer";
      });
    }
    setBookings(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWorker();
  }, [loadWorker]);

  useEffect(() => {
    loadBookings(workerRowId);
  }, [workerRowId, loadBookings]);

  // Realtime: bookings for this worker
  useEffect(() => {
    if (!workerRowId) return;
    const channel = supabase
      .channel(`member-bookings-${workerRowId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `worker_id=eq.${workerRowId}` },
        () => loadBookings(workerRowId),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerRowId, loadBookings]);


  const totalBookings = bookings.length;
  const earnings = useMemo(
    () => bookings.filter((b) => b.status === "completed").reduce((s, b) => s + Number(b.amount ?? 0), 0),
    [bookings],
  );
  const pending = bookings.filter((b) => b.status === "pending");

  return (
    <>
      <header className="bg-primary text-primary-foreground px-5 pt-6 pb-14 rounded-b-3xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs opacity-80 uppercase tracking-wider font-medium">Welcome back,</p>
            <h1 className="font-serif text-2xl mt-1.5">{worker?.name ?? "—"}</h1>
            <p className="text-xs opacity-80 mt-1.5">
              {(worker?.trade ?? "—")}
              {worker?.area ? ` · ${worker.area.split(",")[0]}` : ""}
            </p>
            <div className="mt-2">
              <AvailabilityPill
                workerUserId={workerUserId}
                rowId={worker?.rowId ?? null}
                initial={worker?.isAvailable ?? null}
              />
            </div>
          </div>
          <NotificationBell userId={workerUserId} to="/member/notifications" variant="dark" />

        </div>
      </header>

      {/* Stats */}
      <div className="px-5">
        <div className="bg-card border border-border rounded-3xl p-4 grid grid-cols-2 gap-3 shadow-md">
          <Metric
            label="Total Bookings"
            value={loading ? "…" : String(totalBookings)}
            sub="all time"
            icon={<Calendar className="size-4" />}
            tint="bg-primary/10 text-primary"
          />
          <Metric
            label="Earnings"
            value={loading ? "…" : `₹${earnings.toLocaleString("en-IN")}`}
            sub="completed jobs"
            icon={<IndianRupee className="size-4" />}
            tint="bg-success/15 text-success"
          />
        </div>
      </div>

      {/* Pending Requests */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg font-sans">Customer Requests</h2>
          {pending.length > 0 && (
            <span className="text-[10px] font-bold bg-warning/15 text-warning px-2 py-0.5 rounded-full">
              {pending.length} NEW
            </span>
          )}
        </div>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : pending.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold">No pending requests</p>
            <p className="text-xs text-muted-foreground mt-1">New customer requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((b) => (
              <RequestCard key={b.id} booking={b} onChanged={() => loadBookings(workerRowId)} />
            ))}
          </div>
        )}
      </section>

      {/* Tip */}
      <section className="px-5 mt-6 mb-4">
        <div className="bg-secondary rounded-2xl p-4 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <p className="font-bold text-sm font-sans">Reply faster, rank higher</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accept requests quickly to boost your visibility in your area.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
  tint,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <div className="bg-secondary/50 rounded-2xl p-3">
      <div className={`size-8 rounded-xl flex items-center justify-center ${tint}`}>{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-2">{label}</p>
      <p className="font-bold text-lg font-sans leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function AvailabilityPill({
  workerUserId,
  rowId,
  initial,
}: {
  workerUserId: string | null;
  rowId: string | null;
  initial: boolean | null;
}) {
  const [available, setAvailable] = useState<boolean | null>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAvailable(initial);
  }, [initial]);

  async function toggle() {
    if (available === null || saving) return;
    const next = !available;
    setSaving(true);
    setAvailable(next);

    if (rowId) {
      const { error } = await supabase.from("worker_profiles").update({ is_available: next }).eq("id", rowId);
      if (error) {
        setAvailable(!next);
        toast.error("Couldn't update availability");
        setSaving(false);
        return;
      }
    }

    if (!next && rowId) {
      const { data: cancelled } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("worker_id", rowId)
        .in("status", ["accepted", "in_progress"])
        .select("id");
      if (cancelled && cancelled.length > 0) {
        toast.warning(`${cancelled.length} active booking(s) were cancelled.`);
      }
    }

    toast.success(next ? "You're now Available" : "You're now Unavailable");
    setSaving(false);
  }

  const isOn = available ?? true;
  return (
    <button
      onClick={toggle}
      disabled={available === null || saving}
      className="flex items-center gap-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Toggle availability"
    >
      <span className="relative inline-flex items-center shrink-0">
        <span
          className={`block h-[22px] w-[38px] rounded-full transition-colors duration-200 ${
            isOn ? "bg-success" : "bg-destructive"
          }`}
        />
        <span
          className={`absolute top-0.5 left-0.5 block h-[18px] w-[18px] rounded-full bg-background shadow transition-transform duration-200 ${
            isOn ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span className={`text-xs font-semibold ${isOn ? "text-success" : "text-destructive"}`}>
        {isOn ? "Available" : "Unavailable"}
      </span>
    </button>
  );
}

function RequestCard({ booking, onChanged }: { booking: BookingRow; onChanged: () => void }) {
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [localStatus, setLocalStatus] = useState<string>(booking.status);

  async function update(status: "accepted" | "cancelled") {
    setBusy(status === "accepted" ? "accept" : "reject");
    const { error } = await supabase.from("bookings").update({ status }).eq("id", booking.id);
    setBusy(null);
    if (error) {
      toast.error("Couldn't update booking");
      return;
    }
    setLocalStatus(status);
    onChanged();
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-bold text-sm font-sans truncate">{booking.customer_name ?? "Customer"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{booking.address ?? "—"}</p>
        </div>
        {booking.amount != null && (
          <span className="text-xs font-bold text-primary shrink-0">₹{Number(booking.amount).toLocaleString("en-IN")}</span>
        )}
      </div>
      {(booking.problem_description || booking.service) && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {booking.problem_description || booking.service}
        </p>
      )}
      {(booking.date || booking.time) && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {booking.date ?? ""}{booking.date && booking.time ? " · " : ""}{booking.time ?? ""}
        </p>
      )}

      {localStatus === "pending" ? (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => update("cancelled")}
            disabled={busy !== null}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-secondary disabled:opacity-50"
          >
            {busy === "reject" ? "…" : "Reject"}
          </button>
          <button
            onClick={() => update("accepted")}
            disabled={busy !== null}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-success text-success-foreground disabled:opacity-50"
          >
            {busy === "accept" ? "…" : "Accept"}
          </button>
        </div>
      ) : localStatus === "accepted" ? (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-success font-bold">
          <CircleCheck className="size-4" /> Accepted
        </div>
      ) : (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-destructive font-bold">
          <CircleAlert className="size-4" /> Rejected
        </div>
      )}
    </div>
  );
}
