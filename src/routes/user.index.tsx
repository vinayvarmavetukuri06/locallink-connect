import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Search, Star, Loader2 } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageButton } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { categories, categorySlugFromService } from "@/lib/mock-data";
import { useUserProfile } from "@/lib/profile-store";
import { FeaturedWorkerCard, WorkerListCard, NoWorkersCard } from "@/components/worker-card";
import { useApprovedWorkers } from "@/lib/workers-api";
import { supabase } from "@/integrations/supabase/client";

type RecentBooking = {
  id: string;
  service: string | null;
  amount: number | null;
  created_at: string;
};

export const Route = createFileRoute("/user/")({
  component: UserHome,
});

function UserHome() {
  const currentUser = useUserProfile();
  const { t } = useI18n();
  const { workers, loading, error } = useApprovedWorkers();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.trade.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.area.toLowerCase().includes(q),
    );
  }, [workers, query]);

  const featured = filtered.slice(0, 6);
  const nearby = filtered.slice(0, 8);

  const [lastBooking, setLastBooking] = useState<RecentBooking | null>(null);
  const customerId =
    typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("bookings")
        .select("id, service, amount, created_at")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setLastBooking((data as RecentBooking) ?? null);
    }
    load();
    const ch = supabase
      .channel("home-recent-booking")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${customerId}` },
        () => load(),
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [customerId]);

  const lastCategorySlug = lastBooking ? categorySlugFromService(lastBooking.service) : undefined;
  const lastCategory = lastCategorySlug ? categories.find((c) => c.slug === lastCategorySlug) : undefined;

  return (
    <>
      {/* Header */}
      <header className="bg-card px-5 pt-6 pb-4 border-b border-border sticky top-0 z-30">
        <div className="flex justify-between items-start mb-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              {t("userHome.namaste")}
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
            <LanguageButton />
            <NotificationBell userId={customerId} to="/user/notifications" />
          </div>
        </div>

        <div className="relative flex items-center">
          <Search className="absolute left-4 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("userHome.searchPlaceholder")}
            className="w-full bg-secondary border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
      </header>

      {/* Categories */}
      <section className="px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg font-sans">{t("userHome.services")}</h2>
          <button className="text-primary text-xs font-bold">{t("userHome.viewAll")}</button>
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

      {/* Search results */}
      {query.trim() && (
        <section className="px-5 mb-6">
          <h2 className="font-bold text-lg font-sans mb-4">
            Results for “{query.trim()}”
          </h2>
          {loading ? (
            <LoadingRow />
          ) : filtered.length === 0 ? (
            <NoWorkersCard message="No workers match your search yet — try a different service or area." />
          ) : (
            <div className="space-y-3">
              {filtered.map((w) => (
                <WorkerListCard key={w.id} worker={w} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Featured / Local Heroes */}
      {!query.trim() && (
        <section className="mb-6">
          <div className="px-5 flex justify-between items-center mb-3">
            <h2 className="font-bold text-lg font-sans">Local Heroes</h2>
            <span className="text-[10px] bg-accent/15 text-accent-foreground px-2 py-0.5 rounded font-bold uppercase tracking-tight">
              Verified Experts
            </span>
          </div>
          {loading ? (
            <div className="px-5"><LoadingRow /></div>
          ) : featured.length === 0 ? (
            <div className="px-5"><NoWorkersCard /></div>
          ) : (
            <div className="flex overflow-x-auto gap-4 px-5 pb-2 no-scrollbar [&>*:last-child]:mr-4">
              {featured.map((w) => (
                <FeaturedWorkerCard key={w.id} worker={w} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Nearby Workers */}
      {!query.trim() && (
        <section className="px-5 mb-8">
          <h2 className="font-bold text-lg font-sans mb-4">Nearby Workers</h2>
          {loading ? (
            <LoadingRow />
          ) : nearby.length === 0 ? (
            <NoWorkersCard />
          ) : (
            <div className="space-y-3">
              {nearby.map((w) => (
                <WorkerListCard key={w.id} worker={w} />
              ))}
            </div>
          )}
          {error && (
            <p className="mt-3 text-xs text-destructive">{error}</p>
          )}
        </section>
      )}

      {/* Recent Booking */}
      {!query.trim() && lastBooking && (
        <section className="px-5 mb-8">
          <h2 className="font-bold text-lg font-sans mb-4">Recent Booking</h2>
          <div className="bg-foreground text-background rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-background/10 flex items-center justify-center text-lg shrink-0">
                {lastCategory?.emoji ?? "🛠️"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium opacity-60">
                  {new Date(lastBooking.created_at).toLocaleDateString()}
                </p>
                <h4 className="text-sm font-bold truncate font-sans">
                  {lastBooking.service ?? "Service"}
                </h4>
                <div className="flex items-center gap-1 text-[10px] opacity-80">
                  <Star className="size-2.5 fill-current text-accent" /> ₹{lastBooking.amount ?? 0}
                </div>
              </div>
            </div>
            <Link
              to="/user/bookings"
              className="text-xs font-bold bg-background/15 px-3 py-2 rounded-lg shrink-0"
            >
              View
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center py-6 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}
