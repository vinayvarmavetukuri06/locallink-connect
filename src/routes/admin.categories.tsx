import { createFileRoute } from "@tanstack/react-router";
import { categories, workers } from "@/lib/mock-data";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl">Categories</h1>
            <p className="text-xs text-muted-foreground">{categories.length} active</p>
          </div>
          <button className="size-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
            <Plus className="size-5" />
          </button>
        </div>
      </header>

      <section className="px-5 py-5 space-y-2">
        {categories.map((c) => {
          const count = workers.filter((w) => w.category === c.slug).length;
          return (
            <div key={c.slug} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
              <div className={`size-12 ${c.tint} rounded-2xl flex items-center justify-center text-xl`}>
                {c.emoji}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm font-sans">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{count} workers</p>
              </div>
              <div className="flex gap-1">
                <button className="size-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Pencil className="size-3.5" />
                </button>
                <button className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
