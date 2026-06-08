import { createFileRoute } from "@tanstack/react-router";
import { workers } from "@/lib/mock-data";
import { useState } from "react";
import { BadgeCheck, Crown, FileText } from "lucide-react";

const TABS = ["pending", "approved", "rejected"] as const;

export const Route = createFileRoute("/admin/workers")({
  component: AdminWorkers,
});

function AdminWorkers() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("pending");
  const list = workers.filter((w) => w.approvalStatus === tab);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">Workers</h1>
        <p className="text-xs text-muted-foreground">{workers.length} total · {workers.filter((w) => w.approvalStatus === "approved").length} active</p>
      </header>

      <div className="px-5 pt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-bold px-4 py-2 rounded-full capitalize ${
              tab === t ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
            }`}
          >
            {t} ({workers.filter((w) => w.approvalStatus === t).length})
          </button>
        ))}
      </div>

      <section className="px-5 py-5 space-y-3">
        {list.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">No workers in this tab.</div>
        )}
        {list.map((w) => (
          <div key={w.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className={`size-12 ${w.tint} rounded-2xl flex items-center justify-center font-bold text-slate-700 text-sm`}>
                {w.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm font-sans">{w.name}</p>
                  {w.verified && <BadgeCheck className="size-3.5 text-primary" />}
                  {w.premium && <Crown className="size-3.5 text-accent" />}
                </div>
                <p className="text-[11px] text-muted-foreground">{w.trade} · {w.area}</p>
                <p className="text-[11px] text-muted-foreground">★ {w.rating} · ₹{w.startingPrice} · {w.experience} yrs</p>
              </div>
            </div>
            <button className="mt-3 w-full bg-secondary text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5">
              <FileText className="size-3.5" /> View Documents
            </button>
            {tab === "pending" && (
              <div className="flex gap-2 mt-2">
                <button className="flex-1 py-2 text-xs font-bold rounded-lg bg-destructive/10 text-destructive">
                  Reject
                </button>
                <button className="flex-1 py-2 text-xs font-bold rounded-lg bg-success text-success-foreground">
                  Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
