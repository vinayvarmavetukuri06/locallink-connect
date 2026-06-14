import type { RealWorker } from "@/lib/workers-api";
import { Link } from "@tanstack/react-router";
import { Star, UserRound } from "lucide-react";
import { SaveWorkerButton } from "@/components/save-worker-button";

type AvatarSubject = { tint: string; initials: string };

export function WorkerAvatar({ worker, size = "md" }: { worker: AvatarSubject; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "size-10 text-xs" : size === "lg" ? "size-20 text-xl" : "size-14 text-base";
  return (
    <div
      className={`${sz} ${worker.tint} rounded-2xl flex items-center justify-center font-bold text-slate-700 shrink-0`}
    >
      {worker.initials}
    </div>
  );
}

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold">
      <span className={`size-1.5 rounded-full ${available ? "bg-success" : "bg-muted-foreground"}`} />
      <span className={available ? "text-success" : "text-muted-foreground"}>
        {available ? "Available" : "Busy"}
      </span>
    </span>
  );
}

export function WorkerListCard({ worker }: { worker: RealWorker }) {
  return (
    <div className="relative">
      <Link
        to="/user/worker/$id"
        params={{ id: worker.id }}
        className="block bg-card p-4 rounded-2xl border border-border flex gap-4 hover:border-primary/30 transition-colors"
      >
        <WorkerAvatar worker={worker} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 pr-8">
              <h3 className="font-bold text-sm leading-tight truncate font-sans">{worker.name}</h3>
              <p className="text-[11px] text-muted-foreground truncate">
                {worker.trade}
                {worker.area ? ` • ${worker.area}` : ""}
              </p>
              <AvailabilityBadge available={worker.available} />
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-primary">₹{worker.startingPrice}/hr</p>
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-accent justify-end">
                <Star className="size-3 fill-current" />
                <span>{worker.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <button className="mt-3 w-full bg-foreground text-background text-xs font-bold py-2 rounded-lg active:scale-95 transition-transform">
            Book Now
          </button>
        </div>
      </Link>
      <SaveWorkerButton workerId={worker.id} className="absolute top-3 right-3" size="sm" />
    </div>
  );
}

export function FeaturedWorkerCard({ worker }: { worker: RealWorker }) {
  return (
    <Link
      to="/user/worker/$id"
      params={{ id: worker.id }}
      className="flex-shrink-0 w-64 rounded-3xl p-5 flex flex-col justify-between aspect-[4/3] bg-card text-card-foreground border border-border"
    >
      <div className="flex justify-between items-start">
        <WorkerAvatar worker={worker} size="sm" />
        <div className="text-right text-[10px] font-medium opacity-80">
          <p>STARTS FROM</p>
          <p className="text-lg font-bold text-foreground">₹{worker.startingPrice}/hr</p>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <Star className="size-3 text-accent fill-current shrink-0" />
          <span className="text-[10px] font-bold">{worker.rating.toFixed(1)}</span>
        </div>
        <h3 className="font-bold text-base leading-tight font-sans truncate">{worker.name}</h3>
        <p className="text-xs opacity-80 mt-0.5 truncate">{worker.trade}</p>
        <AvailabilityBadge available={worker.available} />
      </div>
    </Link>
  );
}

export function NoWorkersCard({ message }: { message?: string }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-6 flex flex-col items-center text-center">
      <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
        <UserRound className="size-6" />
      </div>
      <p className="mt-3 text-sm font-semibold">No workers available</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-[28ch]">
        {message ?? "No workers available in your area yet — check back soon!"}
      </p>
    </div>
  );
}
