import { createFileRoute } from "@tanstack/react-router";
import { workers, bookings } from "@/lib/mock-data";
import { Users, Briefcase, IndianRupee, Calendar, TrendingUp, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const totalUsers = 1248;
  const totalWorkers = workers.length;
  const activeMembers = workers.filter((w) => w.approvalStatus === "approved").length;
  const revenue = 124500;
  const totalBookings = bookings.length + 312;

  return (
    <>
      <header className="bg-foreground text-background px-5 pt-6 pb-16 rounded-b-3xl relative">
        <div className="flex items-center gap-2 text-xs font-bold opacity-80">
          <ShieldCheck className="size-4" /> ADMIN PANEL
        </div>
        <h1 className="font-serif text-3xl mt-2">LocalConnect Console</h1>
        <p className="text-xs opacity-70 mt-1">Overview · Today</p>
      </header>

      <div className="px-5 -mt-10">
        <div className="grid grid-cols-2 gap-3">
          <Card label="Total Users" value={totalUsers.toLocaleString("en-IN")} icon={<Users className="size-4" />} tint="bg-primary/10 text-primary" />
          <Card label="Total Workers" value={String(totalWorkers)} icon={<Briefcase className="size-4" />} tint="bg-success/15 text-success" />
          <Card label="Active Members" value={String(activeMembers)} icon={<TrendingUp className="size-4" />} tint="bg-accent/20 text-accent-foreground" />
          <Card label="Revenue" value={`₹${(revenue / 1000).toFixed(0)}K`} icon={<IndianRupee className="size-4" />} tint="bg-primary/10 text-primary" />
        </div>
      </div>

      <section className="px-5 mt-5">
        <div className="bg-card border border-border rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Bookings</p>
              <p className="font-serif text-3xl mt-1">{totalBookings}</p>
            </div>
            <Calendar className="size-8 text-primary" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Mini label="Pending" value={String(bookings.filter((b) => b.status === "pending").length)} />
            <Mini label="Active" value={String(bookings.filter((b) => b.status === "in_progress" || b.status === "accepted").length)} />
            <Mini label="Done" value={String(bookings.filter((b) => b.status === "completed").length)} />
          </div>
        </div>
      </section>

      <section className="px-5 mt-5">
        <h2 className="font-bold text-lg font-sans mb-3">Pending Worker Approvals</h2>
        <div className="space-y-2">
          {workers
            .filter((w) => w.approvalStatus === "pending")
            .map((w) => (
              <div key={w.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                <div className={`size-10 ${w.tint} rounded-xl flex items-center justify-center font-bold text-slate-700 text-xs`}>
                  {w.initials}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm font-sans">{w.name}</p>
                  <p className="text-[11px] text-muted-foreground">{w.trade} · {w.area}</p>
                </div>
                <div className="flex gap-1">
                  <button className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-secondary">Reject</button>
                  <button className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-success text-success-foreground">Approve</button>
                </div>
              </div>
            ))}
          {workers.filter((w) => w.approvalStatus === "pending").length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No pending approvals.</p>
          )}
        </div>
      </section>
    </>
  );
}

function Card({ label, value, icon, tint }: { label: string; value: string; icon: React.ReactNode; tint: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className={`size-8 rounded-xl flex items-center justify-center ${tint}`}>{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-2">{label}</p>
      <p className="font-bold text-xl font-sans">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded-xl py-2">
      <p className="text-sm font-bold font-sans">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
