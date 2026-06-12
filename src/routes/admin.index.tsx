import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Briefcase, Calendar, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

type Profile = { id: string; full_name: string | null; mobile: string | null; location: string | null; role: string | null };

function AdminHome() {
  const [pending, setPending] = useState<WorkerProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [counts, setCounts] = useState({ approved: 0, pending: 0, bookings: 0 });
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
    setCounts({
      approved: allWorkers.filter((w) => w.status === "approved").length,
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
    toast.success(`Worker ${status}`);
    setPending((prev) => prev.filter((w) => w.id !== id));
    setCounts((c) => ({
      ...c,
      pending: c.pending - 1,
      approved: status === "approved" ? c.approved + 1 : c.approved,
    }));
  };

  return (
    <>
      <header className="px-5 pt-4 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <ShieldCheck className="size-4" /> ADMIN PANEL
        </div>
        <h1 className="font-serif text-3xl mt-1">LocalConnect Console</h1>
      </header>

      <section className="px-5 grid grid-cols-3 gap-3">
        <Stat label="Approved" value={counts.approved} icon={<Briefcase className="size-4" />} />
        <Stat label="Pending" value={counts.pending} icon={<Users className="size-4" />} />
        <Stat label="Bookings" value={counts.bookings} icon={<Calendar className="size-4" />} />
      </section>

      <section className="px-5 mt-6">
        <h2 className="font-bold text-lg font-sans mb-3">Pending Worker Applications</h2>
        <div className="space-y-2">
          {pending.length === 0 && (
            <p className="text-xs text-muted-foreground py-3">No pending applications.</p>
          )}
          {pending.map((w) => {
            const p = w.user_id ? profiles[w.user_id] : undefined;
            return (
              <div key={w.id} className="bg-card border border-border rounded-2xl p-4">
                <p className="font-bold text-sm font-sans">{p?.full_name ?? "Unnamed worker"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {w.service_category ?? "—"} · {w.years_of_experience ?? 0} yrs experience
                </p>
                {p?.mobile && <p className="text-[11px] text-muted-foreground">📱 {p.mobile}</p>}
                {p?.location && <p className="text-[11px] text-muted-foreground">📍 {p.location}</p>}
                {w.bio && <p className="text-xs mt-2 line-clamp-2">{w.bio}</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    disabled={busy === w.id}
                    onClick={() => updateWorker(w.id, "rejected")}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-destructive/10 text-destructive disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={busy === w.id}
                    onClick={() => updateWorker(w.id, "approved")}
                    className="flex-1 py-2 text-xs font-bold rounded-lg bg-success text-success-foreground disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="font-bold text-lg font-sans mb-3">All Bookings</h2>
        <div className="space-y-2">
          {bookings.length === 0 && (
            <p className="text-xs text-muted-foreground py-3">No bookings yet.</p>
          )}
          {bookings.map((b) => {
            const customer = b.customer_id ? profiles[b.customer_id] : undefined;
            return (
              <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm font-sans truncate">
                      {customer?.full_name ?? "Customer"} · {b.service ?? "Service"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {b.date ?? "—"} · {b.time ?? "—"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-secondary px-2 py-0.5 rounded-full whitespace-nowrap">
                    {b.status}
                  </span>
                </div>
                {b.problem_description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{b.problem_description}</p>
                )}
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
