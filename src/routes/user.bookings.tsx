import { createFileRoute } from "@tanstack/react-router";
import { bookings, workerById, categoryBySlug } from "@/lib/mock-data";
import type { BookingStatus } from "@/lib/mock-data";
import { useState } from "react";

const TABS: { key: "all" | BookingStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

export const Route = createFileRoute("/user/bookings")({
  component: UserBookings,
});

function UserBookings() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const filtered = tab === "all" ? bookings : bookings.filter((b) => b.status === tab);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">My Bookings</h1>
      </header>

      <div className="px-5 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap ${
              tab === t.key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="px-5 py-5 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">No bookings yet.</div>
        )}
        {filtered.map((b) => {
          const w = workerById(b.workerId);
          const cat = w ? categoryBySlug(w.category) : undefined;
          if (!w) return null;
          return (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`size-12 ${cat?.tint} rounded-2xl flex items-center justify-center text-xl`}>
                    {cat?.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-sm font-sans">{w.name}</p>
                    <p className="text-[11px] text-muted-foreground">{w.trade}</p>
                  </div>
                </div>
                <StatusPill status={b.status} />
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-3">
                <p className="line-clamp-2">{b.description}</p>
                <div className="flex justify-between mt-2">
                  <span>{b.date} · {b.time}</span>
                  <span className="font-bold text-foreground">₹{b.amount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-warning/15 text-warning" },
    accepted: { label: "Accepted", cls: "bg-primary/15 text-primary" },
    in_progress: { label: "In Progress", cls: "bg-accent/20 text-accent-foreground" },
    completed: { label: "Completed", cls: "bg-success/15 text-success" },
    cancelled: { label: "Cancelled", cls: "bg-destructive/15 text-destructive" },
  };
  const m = map[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${m.cls}`}>
      {m.label}
    </span>
  );
}
