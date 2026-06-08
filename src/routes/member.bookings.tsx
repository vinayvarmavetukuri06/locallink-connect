import { createFileRoute } from "@tanstack/react-router";
import { bookings } from "@/lib/mock-data";
import type { BookingStatus } from "@/lib/mock-data";
import { useState } from "react";
import { Phone, MapPin } from "lucide-react";

const TABS: { key: "all" | BookingStatus; label: string }[] = [
  { key: "pending", label: "New" },
  { key: "accepted", label: "Upcoming" },
  { key: "in_progress", label: "Active" },
  { key: "completed", label: "Done" },
];

export const Route = createFileRoute("/member/bookings")({
  component: MemberBookings,
});

function MemberBookings() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");
  const filtered = bookings.filter((b) => b.status === tab);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">Booking Manager</h1>
        <p className="text-xs text-muted-foreground">Manage your customer jobs</p>
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
          <div className="text-center py-10 text-sm text-muted-foreground">No bookings in this tab.</div>
        )}
        {filtered.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-sm font-sans">{b.customerName}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="size-3" /> {b.customerMobile}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="size-3" /> {b.customerAddress}
                </p>
              </div>
              <span className="text-xs font-bold text-primary">₹{b.amount}</span>
            </div>
            <div className="mt-3 bg-secondary rounded-xl p-3">
              <p className="text-xs">{b.description}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{b.date} · {b.time}</p>
            </div>

            {tab === "pending" && (
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-secondary">Reject</button>
                <button className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-success text-success-foreground">
                  Accept
                </button>
              </div>
            )}
            {tab === "accepted" && (
              <button className="mt-3 w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground">
                Mark In Progress
              </button>
            )}
            {tab === "in_progress" && (
              <button className="mt-3 w-full py-2.5 text-xs font-bold rounded-xl bg-success text-success-foreground">
                Mark Completed
              </button>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
