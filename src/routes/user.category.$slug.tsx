import { createFileRoute, Link } from "@tanstack/react-router";
import { categoryBySlug, workersByCategory } from "@/lib/mock-data";
import { WorkerListCard } from "@/components/worker-card";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/user/category/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const cat = categoryBySlug(slug);
  const list = workersByCategory(slug);

  if (!cat) {
    return (
      <div className="p-5">
        <p>Category not found.</p>
        <Link to="/user" className="text-primary">Back home</Link>
      </div>
    );
  }

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-4 border-b border-border sticky top-0 z-30">
        <Link to="/user" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className={`size-12 ${cat.tint} rounded-2xl flex items-center justify-center text-2xl`}>
            {cat.emoji}
          </div>
          <div>
            <h1 className="font-serif text-2xl">{cat.name}</h1>
            <p className="text-xs text-muted-foreground">{list.length} verified workers nearby</p>
          </div>
        </div>
      </header>

      <section className="px-5 py-5 space-y-3">
        {list.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            No workers in this category yet. Check back soon.
          </div>
        ) : (
          list.map((w) => <WorkerListCard key={w.id} worker={w} />)
        )}
      </section>
    </>
  );
}
