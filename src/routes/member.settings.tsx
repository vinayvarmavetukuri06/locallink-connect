import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/member/settings")({
  component: MemberSettings,
});

function MemberSettings() {
  const { t, tService } = useI18n();
  const navigate = useNavigate();
  const workerUserId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    category: "",
    hourlyRate: "",
    years: "",
    bio: "",
  });

  useEffect(() => {
    if (!workerUserId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: prof }, { data: wp }] = await Promise.all([
        supabase.from("profiles").select("full_name, location").eq("id", workerUserId).maybeSingle(),
        supabase
          .from("worker_profiles")
          .select("service_category, hourly_rate, years_of_experience, bio")
          .eq("user_id", workerUserId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setForm({
        name: prof?.full_name ?? "",
        location: prof?.location ?? "",
        category: wp?.service_category ?? "",
        hourlyRate: wp?.hourly_rate != null ? String(wp.hourly_rate) : "",
        years: wp?.years_of_experience != null ? String(wp.years_of_experience) : "",
        bio: wp?.bio ?? "",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [workerUserId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!workerUserId) return;
    setSaving(true);
    try {
      const profileUpdate = supabase
        .from("profiles")
        .update({ full_name: form.name.trim(), location: form.location.trim() })
        .eq("id", workerUserId);

      const workerUpdate = supabase
        .from("worker_profiles")
        .update({
          service_category: form.category || null,
          hourly_rate: form.hourlyRate ? Number(form.hourlyRate) : null,
          years_of_experience: form.years ? Number(form.years) : null,
          bio: form.bio.trim() || null,
        })
        .eq("user_id", workerUserId);

      const [{ error: e1 }, { error: e2 }] = await Promise.all([profileUpdate, workerUpdate]);
      if (e1) throw e1;
      if (e2) throw e2;
      toast.success(t("memberSettings.saved"));
      navigate({ to: "/member/profile" });
    } catch (err) {
      console.error(err);
      toast.error(t("memberSettings.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/member/profile" })}
          className="size-9 -ml-2 rounded-full flex items-center justify-center hover:bg-secondary"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="size-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl leading-tight">{t("memberSettings.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("memberSettings.subtitle")}</p>
        </div>
      </header>

      {loading ? (
        <p className="px-5 py-10 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <form onSubmit={handleSave} className="px-5 py-5 space-y-4">
          <Field label={t("memberSettings.name")}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("memberSettings.namePh")}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm"
              required
            />
          </Field>

          <Field label={t("memberSettings.category")}>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">{t("memberSettings.categoryPh")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {tService(c.slug, c.name)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("memberSettings.location")}>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder={t("memberSettings.locationPh")}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>

          <Field label={t("memberSettings.rate")}>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={form.hourlyRate}
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
              placeholder={t("memberSettings.ratePh")}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>

          <Field label={t("memberSettings.years")}>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={form.years}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                const n = v ? parseInt(v, 10) : 0;
                setForm((f) => ({ ...f, years: n > 50 ? "50" : v }));
              }}
              placeholder={t("memberSettings.yearsPh")}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm"
            />
          </Field>

          <Field label={t("memberSettings.bio")}>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder={t("memberSettings.bioPh")}
              rows={4}
              className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm resize-none"
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-foreground text-background py-3.5 rounded-2xl font-bold text-sm disabled:opacity-60"
          >
            {saving ? t("memberSettings.saving") : t("memberSettings.save")}
          </button>
        </form>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
