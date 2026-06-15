import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Briefcase, Calendar, ShieldCheck, UserCheck, Search, X, Trash2, Star } from "lucide-react";
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
  rating: number | null;
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

type Modal = null | "workers" | "customers";
type Confirm =
  | null
  | { kind: "worker"; id: string; userId: string | null; name: string }
  | { kind: "customer"; id: string; name: string };

function AdminHome() {
  const { t, tService, tStatus } = useI18n();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [counts, setCounts] = useState({ users: 0, workers: 0, pending: 0, bookings: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const [wp, bk, pr] = await Promise.all([
      supabase.from("worker_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, mobile, location, role"),
    ]);
    const allWorkers = (wp.data ?? []) as WorkerProfile[];
    const allBookings = (bk.data ?? []) as Booking[];
    const profs = (pr.data ?? []) as Profile[];
    setWorkers(allWorkers);
    setBookings(allBookings);
    setAllProfiles(profs);
    setProfiles(Object.fromEntries(profs.map((p) => [p.id, p])));
    setCounts({
      users: profs.filter((p) => p.role === "customer" || p.role == null).length,
      workers: allWorkers.filter((w) => w.status === "approved").length,
      pending: allWorkers.filter((w) => w.status === "pending").length,
      bookings: allBookings.length,
    });
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "worker_profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const workerById = useMemo(() => Object.fromEntries(workers.map((w) => [w.id, w])), [workers]);
  const pending = useMemo(() => workers.filter((w) => w.status === "pending"), [workers]);
  const approvedWorkers = useMemo(() => workers.filter((w) => w.status === "approved"), [workers]);
  const customers = useMemo(
    () => allProfiles.filter((p) => p.role === "customer" || p.role == null),
    [allProfiles],
  );

  const bookingsByWorker = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of bookings) {
      if (!b.worker_id) continue;
      m[b.worker_id] = (m[b.worker_id] ?? 0) + 1;
    }
    return m;
  }, [bookings]);

  const updateWorker = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    const { error } = await supabase.from("worker_profiles").update({ status }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`${t("admin.workerUpdated")} ${tStatus(status)}`);
    load();
  };

  const removeWorker = async (workerId: string, userId: string | null) => {
    setBusy(workerId);
    try {
      // Find active customers to notify
      const affected = bookings.filter(
        (b) => b.worker_id === workerId && (b.status === "pending" || b.status === "accepted"),
      );

      await supabase.from("saved_workers").delete().eq("worker_id", workerId);
      await supabase.from("reviews").delete().eq("worker_id", workerId);
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("worker_id", workerId)
        .in("status", ["pending", "accepted"]);
      await supabase.from("worker_profiles").delete().eq("id", workerId);
      if (userId) await supabase.from("profiles").delete().eq("id", userId);

      // Notify affected customers (dedupe per customer)
      const seen = new Set<string>();
      const notes = affected
        .filter((b) => b.customer_id && !seen.has(b.customer_id) && seen.add(b.customer_id!))
        .map((b) => ({
          user_id: b.customer_id!,
          title: t("admin.notifWorkerUnavailableTitle"),
          body: t("admin.notifWorkerUnavailableBody"),
          type: "worker_removed",
          booking_id: b.id,
        }));
      if (notes.length) await supabase.from("notifications").insert(notes);

      toast.success(t("admin.workerRemoved"));
      setConfirm(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? t("admin.removeFailed"));
    } finally {
      setBusy(null);
    }
  };

  const removeCustomer = async (customerId: string) => {
    setBusy(customerId);
    try {
      await supabase.from("saved_workers").delete().eq("customer_id", customerId);
      await supabase.from("reviews").delete().eq("customer_id", customerId);
      await supabase.from("notifications").delete().eq("user_id", customerId);
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("customer_id", customerId)
        .in("status", ["pending", "accepted"]);
      await supabase.from("profiles").delete().eq("id", customerId);
      toast.success(t("admin.customerRemoved"));
      setConfirm(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? t("admin.removeFailed"));
    } finally {
      setBusy(null);
    }
  };

  const filteredWorkers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return approvedWorkers;
    return approvedWorkers.filter((w) => {
      const p = w.user_id ? profiles[w.user_id] : undefined;
      return (
        (p?.full_name ?? "").toLowerCase().includes(q) ||
        (w.service_category ?? "").toLowerCase().includes(q) ||
        (p?.location ?? "").toLowerCase().includes(q) ||
        (p?.mobile ?? "").toLowerCase().includes(q)
      );
    });
  }, [approvedWorkers, profiles, search]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (p) =>
        (p.full_name ?? "").toLowerCase().includes(q) ||
        (p.mobile ?? "").toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const openModal = (m: Modal) => {
    setSearch("");
    setModal(m);
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
        <Stat
          label={t("admin.totalUsers")}
          value={counts.users}
          icon={<Users className="size-4" />}
          onClick={() => openModal("customers")}
        />
        <Stat
          label={t("admin.totalWorkers")}
          value={counts.workers}
          icon={<UserCheck className="size-4" />}
          onClick={() => openModal("workers")}
        />
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
            const wp = b.worker_id ? workerById[b.worker_id] : undefined;
            const worker = wp?.user_id ? profiles[wp.user_id] : undefined;
            return (
              <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm font-sans truncate">
                      {customer?.full_name ?? t("admin.customer")} → {worker?.full_name ?? t("admin.worker")}
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

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-background w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
              <h3 className="font-bold font-sans">
                {modal === "workers" ? t("admin.viewAllWorkers") : t("admin.viewAllCustomers")}
              </h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-secondary">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-5 pt-3">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    modal === "workers" ? t("admin.searchWorkers") : t("admin.searchCustomers")
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {modal === "workers" && filteredWorkers.length === 0 && (
                <p className="text-xs text-muted-foreground py-3">{t("admin.noWorkers")}</p>
              )}
              {modal === "workers" &&
                filteredWorkers.map((w) => {
                  const p = w.user_id ? profiles[w.user_id] : undefined;
                  return (
                    <div key={w.id} className="bg-card border border-border rounded-2xl p-4">
                      <p className="font-bold text-sm font-sans">
                        {p?.full_name ?? t("admin.unnamed")}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {p?.mobile && (
                          <p className="text-[11px] text-muted-foreground">📱 {p.mobile}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          🛠 {tService(w.service_category, w.service_category) || "—"}
                        </p>
                        {p?.location && (
                          <p className="text-[11px] text-muted-foreground">📍 {p.location}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          🎓 {w.years_of_experience ?? 0} {t("admin.yrsExp")}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Star className="size-3 fill-current text-accent" />
                          {Number(w.rating ?? 0).toFixed(1)} · {bookingsByWorker[w.id] ?? 0}{" "}
                          {t("admin.bookings")}
                        </p>
                      </div>
                      <button
                        disabled={busy === w.id}
                        onClick={() =>
                          setConfirm({
                            kind: "worker",
                            id: w.id,
                            userId: w.user_id,
                            name: p?.full_name ?? t("admin.unnamed"),
                          })
                        }
                        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-destructive text-destructive-foreground disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" /> {t("admin.remove")}
                      </button>
                    </div>
                  );
                })}
              {modal === "customers" && filteredCustomers.length === 0 && (
                <p className="text-xs text-muted-foreground py-3">{t("admin.noCustomers")}</p>
              )}
              {modal === "customers" &&
                filteredCustomers.map((p) => (
                  <div key={p.id} className="bg-card border border-border rounded-2xl p-4">
                    <p className="font-bold text-sm font-sans">{p.full_name ?? t("admin.unnamed")}</p>
                    <div className="mt-1 space-y-0.5">
                      {p.mobile && <p className="text-[11px] text-muted-foreground">📱 {p.mobile}</p>}
                      {p.location && (
                        <p className="text-[11px] text-muted-foreground">📍 {p.location}</p>
                      )}
                    </div>
                    <button
                      disabled={busy === p.id}
                      onClick={() =>
                        setConfirm({
                          kind: "customer",
                          id: p.id,
                          name: p.full_name ?? t("admin.unnamed"),
                        })
                      }
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-destructive text-destructive-foreground disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" /> {t("admin.remove")}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-5">
          <div className="bg-background w-full max-w-sm rounded-3xl p-6">
            <h4 className="font-bold font-sans text-lg">
              {confirm.kind === "worker"
                ? t("admin.confirmRemoveWorkerTitle")
                : t("admin.confirmRemoveCustomerTitle")}
            </h4>
            <p className="text-sm text-muted-foreground mt-2">
              {confirm.kind === "worker"
                ? t("admin.confirmRemoveWorkerBody")
                : t("admin.confirmRemoveCustomerBody")}
            </p>
            <p className="text-xs font-bold mt-2">{confirm.name}</p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirm(null)}
                disabled={busy === confirm.id}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-secondary"
              >
                {t("common.cancel")}
              </button>
              <button
                disabled={busy === confirm.id}
                onClick={() =>
                  confirm.kind === "worker"
                    ? removeWorker(confirm.id, confirm.userId)
                    : removeCustomer(confirm.id)
                }
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground disabled:opacity-50"
              >
                {busy === confirm.id ? t("admin.removing") : t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`bg-card border border-border rounded-2xl p-3 text-left w-full ${
        onClick ? "active:scale-[.98] transition-transform hover:border-primary/40" : ""
      }`}
    >
      <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">{label}</p>
      <p className="font-bold text-xl font-sans">{value}</p>
    </Tag>
  );
}
