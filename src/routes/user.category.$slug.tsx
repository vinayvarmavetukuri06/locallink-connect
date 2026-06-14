import { createFileRoute, Link } from "@tanstack/react-router";
import { categoryBySlug } from "@/lib/mock-data";
import { WorkerListCard, NoWorkersCard } from "@/components/worker-card";
import { useApprovedWorkers } from "@/lib/workers-api";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/user/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { t, tService } = useI18n();
  const { slug } = Route.useParams();
  const cat = categoryBySlug(slug);
  const { workers, loading, error } = useApprovedWorkers();
  const list = useMemo(() => workers.filter((w) => w.category === slug), [workers, slug]);

  if (!cat) {
    return (
      <div className="p-5">
        <p>{t("category.notFound")}</p>
        <Link to="/user" className="text-primary">{t("category.backHome")}</Link>
      </div>
    );
  }

  const catName = tService(cat.slug, cat.name);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-4 border-b border-border sticky top-0 z-30">
        <Link to="/user" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="size-4" /> {t("common.back")}
        </Link>
        <div className="flex items-center gap-3">
          <div className={`size-12 ${cat.tint} rounded-2xl flex items-center justify-center text-2xl`}>
            {cat.emoji}
          </div>
          <div>
            <h1 className="font-serif text-2xl">{catName}</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? t("common.loading") : `${list.length} ${list.length === 1 ? t("category.verifiedNearbyOne") : t("category.verifiedNearby")}`}
            </p>
          </div>
        </div>
      </header>

      <section className="px-5 py-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <NoWorkersCard message={t("category.noneInArea")} />
        ) : (
          list.map((w) => <WorkerListCard key={w.id} worker={w} />)
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </section>
    </>
  );
}
