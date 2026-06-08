import { createFileRoute } from "@tanstack/react-router";
import { workers } from "@/lib/mock-data";
import { IndianRupee, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/subscriptions")({
  component: AdminSubs,
});

function AdminSubs() {
  const premium = workers.filter((w) => w.premium && w.approvalStatus === "approved");
  const basic = workers.filter((w) => !w.premium && w.approvalStatus === "approved");
  const mrr = premium.length * 499 + basic.length * 200;

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">Subscriptions</h1>
        <p className="text-xs text-muted-foreground">Revenue & plan management</p>
      </header>

      <section className="px-5 pt-5">
        <div className="bg-foreground text-background rounded-3xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold opacity-80">
            <TrendingUp className="size-4 text-success" /> MONTHLY RECURRING
          </div>
          <p className="font-serif text-4xl mt-1">₹{mrr.toLocaleString("en-IN")}</p>
          <p className="text-xs opacity-70 mt-1">+12.4% vs last month</p>
        </div>
      </section>

      <section className="px-5 mt-5 grid grid-cols-2 gap-3">
        <PlanCard title="Premium" price={499} count={premium.length} tint="bg-accent/15" />
        <PlanCard title="Basic" price={200} count={basic.length} tint="bg-primary/10" />
      </section>

      <section className="px-5 mt-6">
        <h2 className="font-bold text-lg font-sans mb-3">Active Subscriptions</h2>
        <div className="space-y-2">
          {[...premium, ...basic].map((w) => (
            <div key={w.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
              <div className={`size-10 ${w.tint} rounded-xl flex items-center justify-center font-bold text-slate-700 text-xs`}>
                {w.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm font-sans truncate">{w.name}</p>
                <p className="text-[11px] text-muted-foreground">{w.trade}</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${w.premium ? "bg-accent/20 text-accent-foreground" : "bg-primary/10 text-primary"}`}>
                  {w.premium ? "Premium" : "Basic"}
                </span>
                <p className="text-[10px] text-success font-bold mt-1">Active</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PlanCard({ title, price, count, tint }: { title: string; price: number; count: number; tint: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={`size-8 rounded-xl flex items-center justify-center ${tint}`}>
        <IndianRupee className="size-4" />
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-2">{title} · ₹{price}/mo</p>
      <p className="font-bold text-2xl font-sans">{count}</p>
      <p className="text-[10px] text-muted-foreground">subscribers</p>
    </div>
  );
}
