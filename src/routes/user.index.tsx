import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Search, Mic, Bell, Star } from "lucide-react";
import { categories, workers, currentUser, bookings, workerById } from "@/lib/mock-data";
import { FeaturedWorkerCard, WorkerListCard } from "@/components/worker-card";

export const Route = createFileRoute("/user/")({
  component: UserHome,
});

function UserHome() {
  const featured = workers.filter((w) => w.premium && w.approvalStatus === "approved");
  const nearby = workers
    .filter((w) => w.approvalStatus === "approved")
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 4);
  const lastBooking = bookings.find((b) => b.status === "completed");
  const lastWorker = lastBooking ? workerById(lastBooking.workerId) : undefined;

  return (
    <>
      {/* Header */}
      <header className="bg-card px-5 pt-6 pb-4 border-b border-border sticky top-0 z-30">
        <div className="flex justify-between items-start mb-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              Namaste,
            </p>
            <h1 className="font-serif text-2xl truncate">{currentUser.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-full border border-border">
              <MapPin className="size-3 text-primary" />
              <span className="text-xs font-semibold truncate max-w-[10ch]">
                {currentUser.location.split(",")[0]}
              </span>
            </button>
            <button className="size-9 rounded-full bg-secondary border border-border flex items-center justify-center relative">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-2 bg-warning rounded-full ring-2 ring-card" />
            </button>
          </div>
        </div>

        <div className="relative flex items-center">
          <Search className="absolute left-4 size-4 text-muted-foreground" />
          <input
            placeholder="Search for 'Electrician'..."
            className="w-full bg-secondary border-none rounded-2xl py-3.5 pl-11 pr-12 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <button className="absolute right-2 size-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center">
            <Mic className="size-4" />
          </button>
        </div>
      </header>

      {/* Categories */}
      <section className="px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg font-sans">Our Services</h2>
          <button className="text-primary text-xs font-bold">View All</button>
        </div>
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/user/category/$slug"
              params={{ slug: c.slug }}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className={`size-14 ${c.tint} rounded-2xl flex items-center justify-center text-2xl`}>
                {c.emoji}
              </div>
              <span className="text-[10px] font-semibold text-center leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured / Local Heroes */}
      <section className="mb-6">
        <div className="px-5 flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg font-sans">Local Heroes</h2>
          <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded font-bold uppercase tracking-tight">
            Verified Experts
          </span>
        </div>
        <div className="flex overflow-x-auto gap-4 px-5 pb-2 no-scrollbar [&>*:last-child]:mr-4">
          {featured.map((w) => (
            <FeaturedWorkerCard key={w.id} worker={w} />
          ))}
        </div>
      </section>

      {/* Nearby Workers */}
      <section className="px-5 mb-8">
        <h2 className="font-bold text-lg font-sans mb-4">Nearby Workers</h2>
        <div className="space-y-3">
          {nearby.map((w) => (
            <WorkerListCard key={w.id} worker={w} />
          ))}
        </div>
      </section>

      {/* Recent Booking */}
      {lastBooking && lastWorker && (
        <section className="px-5 mb-8">
          <h2 className="font-bold text-lg font-sans mb-4">Recent Booking</h2>
          <div className="bg-foreground text-background rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-background/10 flex items-center justify-center text-lg shrink-0">
                {categories.find((c) => c.slug === lastWorker.category)?.emoji}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium opacity-60">Last Service: 2 days ago</p>
                <h4 className="text-sm font-bold truncate font-sans">
                  {lastWorker.trade}
                </h4>
                <div className="flex items-center gap-1 text-[10px] opacity-80">
                  <Star className="size-2.5 fill-current text-accent" />
                  {lastWorker.rating} · ₹{lastBooking.amount}
                </div>
              </div>
            </div>
            <button className="text-xs font-bold bg-background/15 px-3 py-2 rounded-lg shrink-0">
              Re-book
            </button>
          </div>
        </section>
      )}
    </>
  );
}
