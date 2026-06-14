import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Briefcase, Calendar, ShieldCheck, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

type WorkerProfile = {
  id: string;
  user_id: string | null;
  service_category: string | null;
  years_of_experience: number | null;
  hourly_rate: number | null;
  bio: string | null;
  status: string;
  created_at: string;
};

type Booking = {
  id: string;
  customer_id: string | null;
  worker_id: string | null;
  service: string | null;
  date: string | null;
  time: string | null;
  status: string;
  amount: number | null;
  address: string | null;
  problem_description: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  mobile: string | null;
  location: string | null;
  role: string | null;
};

function AdminHome() {
  const { t, tService, tStatus } = useI18n();
  const [pending, setPending] = useState<WorkerProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [workerByUserId, setWorkerByUserId] = useState<Record<string, WorkerProfile>>({});
  const [counts, setCounts] = useState({ users: 0, workers: 0, pending: 0, bookings: 0 });
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const [wp, bk, pr] = await Promise.all([
      supabase.from("worker_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, mobile, location, role"),
    ]);
    const allWorkers = (wp.data ?? []) as WorkerProfile[];
    const allBookings = (bk.data ?? []) as Booking[];
    const allProfiles = (pr.data ?? []) as Profile[];

    setPending(allWorkers.filter((w) => w.status === "pending"));
    setBookings(allBookings);
    setProfiles(Object.fromEntries(allProfiles.map((p) => [p.id, p])));
    setWorkerByUserId(
      Object.fromEntries(allWorkers.filter((w) => w.user_id).map((w) => [w.user_id as string, w])),
    );
    setCounts({
      users: allProfiles.filter((p) => p.role === "customer").length,
      workers: allWorkers.filter((w) => w.status === "approved").length,
      pending: allWorkers.filter((w) => w.status === "pending").length,
      bookings: allBookings.length,
    });
  };

  useEffect(() => {
    load();
  }, []);

  const updateWorker = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    const { error } = await supabase.from("worker_profiles").update({ status }).eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${t("admin.workerUpdated")} ${tStatus(status)}`);
    setPending((prev) => prev.filter((w) => w.id !== id));
    setCounts((c) => ({
      ...c,
      pending: c.pending - 1,
      workers: status === "approved" ? c.workers + 1 : c.workers,
    }));
  };

  return (
    <>
      <header className="px-5 pt-4 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <ShieldCheck className="size-4" /> {t("admin.panel")}
        </div>
        <h1 className="font-serif text-3xl mt-1">{t("admin.console")}</h1>
      </header>

      <section className="px-5 grid grid-cols-2 gap-3">
        <Stat label={t("admin.totalUsers")} value={counts.users} icon={<Users className="size-4" />} />
        <Stat label={t("admin.totalWorkers")} value={counts.workers} icon={<UserCheck className="size-4" />} />
        <Stat label={t("admin.pendingApprovals")} value={counts.pending} icon={<Briefcase className="size-4" />} />
        <Stat label={t("admin.totalBookings")} value={counts.bookings} icon={<Calendar className="size-4" />} />
      </section>

      <section className="px-5 mt-6">
        <h2 className="font-bold text-lg font-sans mb-3">{t("admin.pendingApps")}</h2>
        <div className="space-y-2">
          {pending.length === 0 && (
            <p className="text-xs text-muted-foreground py-3">{t("admin.noPendingApps")}</p>
          )}
          {pending.map((w) => {
            const p = w.user_id ? profiles[w.user_id] : undefined;
            return (
              <div key={w.id} className="bg-card border border-border rounded-2xl p-4">
                <p className="font-bold text-sm font-sans">{p?.full_name ?? t("admin.unnamed")}</p>
                <div className="mt-1 space-y-0.5">
                  {p?.mobile && <p className="text-[11px] text-muted-foreground">📱 {p.mobile}</p>}
                  <p className="text-[11px] text-muted-foreground">
                    🛠 {tService(w.service_category, w.service_category) || "—"}
                  </p>
                  {p?.location && <p className="text-[11px] text-muted-foreground">📍 {p.location}</p>}
                  <p className="text-[11px] text-muted-foreground">
                    🎓 {w.years_of_experience ?? 0} {t("admin.yrsExp")}
                  </p>
                </div>
                {w.bio && <p className="text-xs mt-2 line-clamp-2">{w.bio}</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    disabled={busy === w.id}
                    onClick={() => updateWorker(w.id, "rejected")}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-destructive/10 text-destructive disabled:opacity-50"
                  >
                    {t("admin.reject")}
                  </button>
                  <button
                    disabled={busy === w.id}
                    onClick={() => updateWorker(w.id, "approved")}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-success text-success-foreground disabled:opacity-50"
                  >
                    {t("admin.approve")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="font-bold text-lg font-sans mb-3">{t("admin.allBookings")}</h2>
        <div className="space-y-2">
          {bookings.length === 0 && (
            <p className="text-xs text-muted-foreground py-3">{t("admin.noBookings")}</p>
          )}
          {bookings.map((b) => {
            const customer = b.customer_id ? profiles[b.customer_id] : undefined;
            const workerProfile = b.worker_id ? workerByUserId[b.worker_id] : undefined;
            const worker = workerProfile?.user_id ? profiles[workerProfile.user_id] : undefined;
            return (
              <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm font-sans truncate">
                      {customer?.full_name ?? t("memberHome.customer")} → {worker?.full_name ?? t("worker.workerLbl")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {b.service ?? t("worker.service")} · {b.date ?? "—"} · {b.time ?? "—"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-secondary px-2 py-0.5 rounded-full whitespace-nowrap">
                    {tStatus(b.status)}
                  </span>
                </div>
                <div className="flex justify-between mt-2 text-[11px]">
                  <span className="text-muted-foreground truncate">{b.address ?? ""}</span>
                  {b.amount != null && <span className="font-bold">₹{b.amount}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">{label}</p>
      <p className="font-bold text-xl font-sans">{value}</p>
    </div>
  );
}
