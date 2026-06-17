import { createFileRoute, Link } from "@tanstack/react-router";
import { categoryBySlug } from "@/lib/mock-data";
import { WorkerListCard, NoWorkersCard } from "@/components/worker-card";
import { useApprovedWorkers } from "@/lib/workers-api";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useUserProfile } from "@/lib/profile-store";
import { LocationPickerModal } from "@/components/location-picker-modal";

export const Route = createFileRoute("/user/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { t, tService } = useI18n();
  const { slug } = Route.useParams();
  const cat = categoryBySlug(slug);
  const { workers, loading, error } = useApprovedWorkers();
  const currentUser = useUserProfile();
  const [locationOpen, setLocationOpen] = useState(false);
  const customerId =
    typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  const userCity = (currentUser.location ?? "").split(",")[0].trim();
  const userCityLc = userCity.toLowerCase();
  const hasCity = userCityLc && userCityLc !== "—";

  const list = useMemo(() => {
    const byCat = workers.filter(
      (w) => w.categories?.includes(slug) || w.category === slug,
    );
    if (!hasCity) return byCat;
    return byCat.filter((w) => {
      const area = (w.area ?? "").toLowerCase();
      if (!area) return false;
      return area.includes(userCityLc) || userCityLc.includes(area);
    });
  }, [workers, slug, hasCity, userCityLc]);

  if (!cat) {
    return (
      <div className="p-5">
        <p>{t("category.notFound")}</p>
        <Link to="/user" className="text-primary">{t("category.backHome")}</Link>
      </div>
    );
  }

  const catName = tService(cat.slug, cat.name);
  const emptyMsg = hasCity
    ? t("userHome.noWorkersInCity").replace("{city}", userCity)
    : t("category.noneInArea");

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-4 border-b border-border sticky top-0 z-30">
        <Link to="/user" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="size-4" /> {t("common.back")}
        </Link>
        <div className="flex items-center gap-3">
          <div className={`size-12 ${cat.tint} rounded-2xl flex items-center justify-center text-2xl`}>
            <span aria-hidden>{cat.emoji || catName.trim().charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-2xl">{catName}</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? t("common.loading") : `${list.length} ${list.length === 1 ? t("category.verifiedNearbyOne") : t("category.verifiedNearby")}`}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="inline-flex items-center gap-1.5 bg-secondary border border-border rounded-full px-3 py-1.5 text-xs font-semibold active:scale-95 transition"
            aria-label={t("city.tapToChange")}
          >
            <MapPin className="size-3 text-primary" />
            <span className="truncate max-w-[16ch]">
              {hasCity
                ? t("city.filterIn").replace("{city}", userCity)
                : t("city.setLocation")}
            </span>
          </button>
        </div>
      </header>

      <section className="px-5 py-5 space-y-3 stagger-cards">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <NoWorkersCard message={emptyMsg} />
        ) : (
          list.map((w) => <WorkerListCard key={w.id} worker={w} />)
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </section>

      <LocationPickerModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        userId={customerId}
      />
    </>
  );
}
