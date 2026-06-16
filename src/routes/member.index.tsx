import { createFileRoute } from "@tanstack/react-router";
import {
  IndianRupee,
  Calendar,
  TrendingUp,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageButton } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";
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
  const { t, tService } = useI18n();
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
      name: profile?.full_name ?? "",
      category: slug,
      trade: tService(slug, categoryBySlug(slug)?.name ?? t("memberHome.servicePro")),
      area: profile?.location ?? "",
      isAvailable: wp?.is_available ?? true,
    });
  }, [workerUserId, t, tService]);

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
        r.customer_name = (r.customer_id && map.get(r.customer_id)) || t("memberHome.customer");
      });
    }
    setBookings(rows);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    loadWorker();
  }, [loadWorker]);

  useEffect(() => {
    loadBookings(workerRowId);
  }, [workerRowId, loadBookings]);

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
  const active = bookings.filter((b) => b.status === "pending" || b.status === "accepted" || b.status === "in_progress");

  return (
    <>
      <header className="bg-primary text-primary-foreground px-5 pt-6 pb-14 rounded-b-3xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs opacity-80 uppercase tracking-wider font-medium">{t("memberHome.welcome")}</p>
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
          <div className="flex items-center gap-2">
            <LanguageButton variant="dark" />
            <NotificationBell userId={workerUserId} to="/member/notifications" variant="dark" />
          </div>
        </div>
      </header>

      <div className="px-5">
        <div className="bg-card border border-border rounded-3xl p-4 grid grid-cols-2 gap-3 shadow-md">
          <Metric
            label={t("memberHome.totalBookings")}
            value={loading ? "…" : String(totalBookings)}
            sub={t("memberHome.allTime")}
            icon={<Calendar className="size-4" />}
            tint="bg-primary/10 text-primary"
          />
          <Metric
            label={t("memberHome.earnings")}
            value={loading ? "…" : `₹${earnings.toLocaleString("en-IN")}`}
            sub={t("memberHome.completedJobs")}
            icon={<IndianRupee className="size-4" />}
            tint="bg-success/15 text-success"
          />
        </div>
      </div>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg font-sans">{t("memberHome.customerRequests")}</h2>
          {pending.length > 0 && (
            <span className="text-[10px] font-bold bg-warning/15 text-warning px-2 py-0.5 rounded-full">
              {pending.length} {t("memberHome.new")}
            </span>
          )}
        </div>
        {loading ? (
          <p className="text-xs text-muted-foreground">{t("memberHome.loading")}</p>
        ) : active.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold">{t("memberHome.noPending")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("memberHome.noPendingSub")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.slice(0, 5).map((b) => (
              <RequestCard key={b.id} booking={b} onChanged={() => loadBookings(workerRowId)} />
            ))}
          </div>
        )}
      </section>

      <section className="px-5 mt-6 mb-4">
        <div className="bg-secondary rounded-2xl p-4 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <p className="font-bold text-sm font-sans">{t("memberHome.replyFaster")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("memberHome.replyFasterDesc")}
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
  rowId,
  initial,
}: {
  workerUserId: string | null;
  rowId: string | null;
  initial: boolean | null;
}) {
  const { t } = useI18n();
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
        toast.error(t("memberHome.couldNotUpdate"));
        setSaving(false);
        return;
      }
    }

    // NOTE: Availability toggle only affects whether the worker is shown in
    // search / listings for NEW bookings. Existing bookings (pending,
    // accepted, in_progress) are intentionally left untouched.


    toast.success(next ? t("memberHome.nowAvailable") : t("memberHome.nowUnavailable"));
    setSaving(false);
  }

  const isOn = available ?? true;
  return (
    <button
      onClick={toggle}
      disabled={available === null || saving}
      className="flex items-center gap-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={t("memberProfile.availability")}
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
        {isOn ? t("memberHome.available") : t("memberHome.unavailable")}
      </span>
    </button>
  );
}

function RequestCard({ booking, onChanged }: { booking: BookingRow; onChanged: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState<"accept" | "reject" | "complete" | null>(null);
  const [localStatus, setLocalStatus] = useState<string>(booking.status);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function update(status: "accepted" | "cancelled" | "completed", kind: "accept" | "reject" | "complete") {
    setBusy(kind);
    const { error } = await supabase.from("bookings").update({ status }).eq("id", booking.id);
    setBusy(null);
    if (error) {
      toast.error(t("memberHome.couldNotUpdateBooking"));
      return;
    }
    setLocalStatus(status);
    onChanged();
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-bold text-sm font-sans truncate">{booking.customer_name ?? t("memberHome.customer")}</p>
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
            onClick={() => update("cancelled", "reject")}
            disabled={busy !== null}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-secondary disabled:opacity-50"
          >
            {busy === "reject" ? "…" : t("memberHome.reject")}
          </button>
          <button
            onClick={() => update("accepted", "accept")}
            disabled={busy !== null}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-success text-success-foreground disabled:opacity-50"
          >
            {busy === "accept" ? "…" : t("memberHome.accept")}
          </button>
        </div>
      ) : (localStatus === "accepted" || localStatus === "in_progress") ? (
        <div className="mt-3 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-success font-bold">
            <CircleCheck className="size-4" /> {t("memberHome.accepted")}
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={busy !== null}
            className="w-full py-2 text-xs font-bold rounded-lg bg-success text-success-foreground flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <CircleCheck className="size-3.5" /> {busy === "complete" ? "…" : t("memberBookings.markComplete")}
          </button>
        </div>
      ) : (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-destructive font-bold">
          <CircleAlert className="size-4" /> {t("memberHome.rejected")}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t("memberBookings.confirmCompleteTitle")}
        message={t("memberBookings.confirmCompleteMsg")}
        confirmLabel={t("common.confirm")}
        confirmVariant="success"
        busy={busy === "complete"}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await update("completed", "complete");
        }}
      />
    </div>
  );
}
