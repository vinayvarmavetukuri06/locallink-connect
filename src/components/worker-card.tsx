import type { RealWorker } from "@/lib/workers-api";
import { Link } from "@tanstack/react-router";
import { Star, UserRound } from "lucide-react";
import { SaveWorkerButton } from "@/components/save-worker-button";
import { useI18n } from "@/lib/i18n";
import { categoryBySlug } from "@/lib/mock-data";

type AvatarSubject = { tint: string; initials: string; avatarUrl?: string | null; name?: string };

export function WorkerAvatar({ worker, size = "md" }: { worker: AvatarSubject; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "size-10 text-xs" : size === "lg" ? "size-20 text-xl" : "size-14 text-base";
  if (worker.avatarUrl) {
    return (
      <div className={`${sz} rounded-2xl overflow-hidden shrink-0 bg-secondary`}>
        <img src={worker.avatarUrl} alt={worker.name ?? ""} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${sz} ${worker.tint} rounded-2xl flex items-center justify-center font-bold text-slate-700 shrink-0`}
    >
      {worker.initials}
    </div>
  );
}

export function AvailabilityBadge({ available }: { available: boolean }) {
  const { t } = useI18n();
  return (
    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold">
      <span className={`size-1.5 rounded-full ${available ? "bg-success" : "bg-muted-foreground"}`} />
      <span className={available ? "text-success" : "text-muted-foreground"}>
        {available ? t("card.available") : t("card.busy")}
      </span>
    </span>
  );
}

export function CategoryBadges({ slugs, max }: { slugs: string[]; max?: number }) {
  const { tService } = useI18n();
  if (!slugs?.length) return null;
  const shown = typeof max === "number" ? slugs.slice(0, max) : slugs;
  const rest = typeof max === "number" ? Math.max(0, slugs.length - max) : 0;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => {
        const c = categoryBySlug(s);
        return (
          <span
            key={s}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c?.tint ?? "bg-secondary"} text-slate-700`}
          >
            {c?.emoji ? <span>{c.emoji}</span> : null}
            <span>{tService(s, c?.name ?? s)}</span>
          </span>
        );
      })}
      {rest > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">
          +{rest}
        </span>
      )}
    </div>
  );
}

export function WorkerListCard({ worker }: { worker: RealWorker }) {
  const { t } = useI18n();
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
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate font-sans">{worker.name}</h3>
              {worker.area && (
                <p className="text-[11px] text-muted-foreground truncate">{worker.area}</p>
              )}
              <AvailabilityBadge available={worker.available} />
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-0.5 text-[11px] font-bold text-accent justify-end">
                <Star className="size-3 fill-current" />
                <span>{worker.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <CategoryBadges slugs={worker.categories} max={3} />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <button className="bg-foreground text-background text-xs font-bold py-2 px-5 rounded-lg active:scale-95 transition-transform">
              {t("card.bookNow")}
            </button>
            <SaveWorkerButton workerId={worker.id} size="sm" />
          </div>
        </div>
      </Link>
    </div>
  );
}

export function FeaturedWorkerCard({ worker }: { worker: RealWorker }) {
  const { tService } = useI18n();
  return (
    <div className="relative flex-shrink-0 w-64">
      <Link
        to="/user/worker/$id"
        params={{ id: worker.id }}
        className="rounded-3xl p-5 flex flex-col justify-between aspect-[4/3] bg-card text-card-foreground border border-border"
      >
        <div className="flex justify-between items-start">
          <WorkerAvatar worker={worker} size="sm" />
          <div className="text-right text-[10px] font-medium opacity-80 pr-10">
            <p className="text-lg font-bold text-foreground">₹{worker.startingPrice}/hr</p>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Star className="size-3 text-accent fill-current shrink-0" />
            <span className="text-[10px] font-bold">{worker.rating.toFixed(1)}</span>
          </div>
          <h3 className="font-bold text-base leading-tight font-sans truncate">{worker.name}</h3>
          <p className="text-xs opacity-80 mt-0.5 truncate">{tService(worker.category, worker.trade)}</p>
          <div className="mt-1.5">
            <CategoryBadges slugs={worker.categories} max={2} />
          </div>
          <AvailabilityBadge available={worker.available} />
        </div>
      </Link>
      <SaveWorkerButton workerId={worker.id} className="absolute top-4 right-4" size="sm" />
    </div>
  );
}

export function NoWorkersCard({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl p-6 flex flex-col items-center text-center">
      <div className="size-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
        <UserRound className="size-6" />
      </div>
      <p className="mt-3 text-sm font-semibold">{t("card.noAvailable")}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-[28ch]">
        {message ?? t("card.noAvailableSub")}
      </p>
    </div>
  );
}
