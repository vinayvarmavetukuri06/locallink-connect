import { createFileRoute } from "@tanstack/react-router";
import { bookings, workerById } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookings,
});

function AdminBookings() {
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">All Bookings</h1>
        <p className="text-xs text-muted-foreground">Monitor every job on the platform</p>
      </header>

      <section className="px-5 py-5 space-y-2.5">
        {bookings.map((b) => {
          const w = workerById(b.workerId);
          return (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-sm font-sans">{b.customerName} → {w?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{w?.trade}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-secondary px-2 py-0.5 rounded-full">
                  {b.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>
              <div className="flex justify-between mt-2 text-[11px]">
                <span className="text-muted-foreground">{b.date} · {b.time}</span>
                <span className="font-bold">₹{b.amount}</span>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
