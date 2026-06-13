import type { Worker } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";
import { Star, BadgeCheck, Crown } from "lucide-react";

export function WorkerAvatar({ worker, size = "md" }: { worker: Worker; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "size-10 text-xs" : size === "lg" ? "size-20 text-xl" : "size-14 text-base";
  return (
    <div
      className={`${sz} ${worker.tint} rounded-2xl flex items-center justify-center font-bold text-slate-700 shrink-0`}
    >
      {worker.initials}
    </div>
  );
}

export function WorkerListCard({ worker }: { worker: Worker }) {
  return (
    <Link
      to="/user/worker/$id"
      params={{ id: worker.id }}
      className="block bg-card p-4 rounded-2xl border border-border flex gap-4 hover:border-primary/30 transition-colors"
    >
      <WorkerAvatar worker={worker} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-sm leading-tight truncate font-sans">{worker.name}</h3>
              {worker.verified && <BadgeCheck className="size-3.5 text-primary shrink-0" />}
              {worker.premium && <Crown className="size-3.5 text-accent shrink-0" />}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {worker.trade} • {worker.distanceKm}km
            </p>
            <AvailabilityBadge available={worker.available !== false} />
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-primary">₹{worker.startingPrice}</p>
            <div className="flex items-center gap-0.5 text-[10px] font-bold text-accent justify-end">
              <Star className="size-3 fill-current" />
              <span>{worker.rating}</span>
            </div>
          </div>
        </div>
        <button className="mt-3 w-full bg-foreground text-background text-xs font-bold py-2 rounded-lg active:scale-95 transition-transform">
          Book Now
        </button>
      </div>
    </Link>
  );
}

export function FeaturedWorkerCard({ worker }: { worker: Worker }) {
  return (
    <Link
      to="/user/worker/$id"
      params={{ id: worker.id }}
      className={`flex-shrink-0 w-64 rounded-3xl p-5 text-primary-foreground flex flex-col justify-between aspect-[4/3] shadow-xl shadow-primary/20 ${
        worker.premium ? "bg-primary" : "bg-card text-card-foreground border border-border shadow-none"
      }`}
    >
      <div className="flex justify-between items-start">
        <WorkerAvatar worker={worker} size="sm" />
        <div className="text-right text-[10px] font-medium opacity-80">
          <p>STARTS FROM</p>
          <p className={`text-lg font-bold ${worker.premium ? "" : "text-foreground"}`}>₹{worker.startingPrice}</p>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <Star className="size-3 text-accent fill-current shrink-0" />
          <span className="text-[10px] font-bold">{worker.rating}</span>
          <span className="text-[10px] opacity-80">({worker.reviews})</span>
        </div>
        <h3 className="font-bold text-base leading-tight font-sans truncate">{worker.name}</h3>
        <p className="text-xs opacity-80 mt-0.5 truncate">{worker.trade}</p>
      </div>
    </Link>
  );
}
