import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Star, Camera, MapPin, Briefcase, Clock, Settings, LogOut, X, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categories, categoryBySlug } from "@/lib/mock-data";
import { initialsFromName, tintFromId } from "@/lib/workers-api";
import { clearSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { CityAutocomplete } from "@/components/city-autocomplete";

export const Route = createFileRoute("/member/profile")({
  component: MemberProfile,
});

type Profile = {
  name: string;
  area: string;
  categorySlugs: string[];
  years: number | null;
  rating: number;
  jobsCount: number;
  isAvailable: boolean;
  avatarUrl: string | null;
  initials: string;
  tint: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string;
  created_at: string;
};

async function signedAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}

function MemberProfile() {
  const { t, tService } = useI18n();
  const navigate = useNavigate();
  const workerUserId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [catModal, setCatModal] = useState(false);
  const [areaModal, setAreaModal] = useState(false);
  const [availModal, setAvailModal] = useState(false);

  function handleLogout() {
    clearSession();
    navigate({ to: "/" });
  }

  async function loadProfile() {
    if (!workerUserId) {
      setLoading(false);
      return;
    }
    const [{ data: prof }, { data: wp }] = await Promise.all([
      supabase.from("profiles").select("full_name, location, avatar_url").eq("id", workerUserId).maybeSingle(),
      supabase
        .from("worker_profiles")
        .select("id, service_category, service_categories, years_of_experience, is_available")
        .eq("user_id", workerUserId)
        .maybeSingle(),
    ]);
    const workerRowId = wp?.id ?? null;
    const [{ data: reviewRows }, { count: jobsCount }] = await Promise.all([
      workerRowId
        ? supabase
            .from("reviews")
            .select("id, rating, comment, customer_id, created_at")
            .eq("worker_id", workerRowId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      workerRowId
        ? supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("worker_id", workerRowId)
            .eq("status", "completed")
        : Promise.resolve({ count: 0 as number | null }),
    ]);

    const reviewsArr = (reviewRows ?? []) as any[];
    const avgRating =
      reviewsArr.length > 0
        ? reviewsArr.reduce((s, r) => s + Number(r.rating ?? 0), 0) / reviewsArr.length
        : 0;

    const customerIds = Array.from(
      new Set(reviewsArr.map((r) => r.customer_id).filter(Boolean) as string[]),
    );
    const nameMap = new Map<string, string>();
    if (customerIds.length) {
      const { data: custProfs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", customerIds);
      (custProfs ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name ?? ""));
    }

    const arr = (wp?.service_categories ?? []) as string[];
    const slugs = arr.length > 0 ? arr : wp?.service_category ? [wp.service_category] : [];
    const name = prof?.full_name ?? "";
    const avatarUrl = await signedAvatarUrl((prof as any)?.avatar_url ?? null);
    setProfile({
      name,
      area: prof?.location ?? "",
      categorySlugs: slugs,
      years: wp?.years_of_experience ?? null,
      rating: avgRating,
      jobsCount: jobsCount ?? 0,
      isAvailable: wp?.is_available ?? true,
      avatarUrl,
      initials: initialsFromName(name),
      tint: tintFromId(workerUserId),
    });
    setReviews(
      reviewsArr.map((r) => ({
        id: r.id,
        rating: r.rating ?? 0,
        comment: r.comment,
        customer_name: (r.customer_id && nameMap.get(r.customer_id)) || t("memberHome.customer"),
        created_at: r.created_at,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadProfile();
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerUserId]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !workerUserId) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${workerUserId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", workerUserId);
      if (dbErr) throw dbErr;
      const signed = await signedAvatarUrl(path);
      setProfile((p) => (p ? { ...p, avatarUrl: signed } : p));
      toast.success(t("memberProfile.uploadSuccess"));
    } catch (err) {
      console.error(err);
      toast.error(t("memberProfile.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function saveCategories(next: string[]) {
    if (!workerUserId) return;
    if (next.length === 0) {
      toast.error(t("memberProfile.pickAtLeastOne"));
      return;
    }
    const { error } = await supabase
      .from("worker_profiles")
      .update({ service_categories: next, service_category: next[0] })
      .eq("user_id", workerUserId);
    if (error) {
      toast.error(t("memberProfile.saveFailed"));
      return;
    }
    setProfile((p) => (p ? { ...p, categorySlugs: next } : p));
    toast.success(t("memberProfile.categoryUpdated"));
    setCatModal(false);
  }

  async function saveArea(next: string) {
    if (!workerUserId) return;
    const value = next.trim();
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("profiles").update({ location: value }).eq("id", workerUserId),
      supabase.from("worker_profiles").update({ bio: undefined as any }).eq("user_id", workerUserId).select().limit(0),
    ]);
    // also store on worker_profiles via a separate update without touching unrelated cols
    await supabase.from("worker_profiles").update({}).eq("user_id", workerUserId);
    if (e1 || e2) {
      toast.error(t("memberProfile.saveFailed"));
      return;
    }
    setProfile((p) => (p ? { ...p, area: value } : p));
    toast.success(t("memberProfile.areaUpdated"));
    setAreaModal(false);
  }

  async function saveAvailability(val: boolean) {
    if (!workerUserId) return;
    const { error } = await supabase
      .from("worker_profiles")
      .update({ is_available: val })
      .eq("user_id", workerUserId);
    if (error) {
      toast.error(t("memberProfile.saveFailed"));
      return;
    }
    setProfile((p) => (p ? { ...p, isAvailable: val } : p));
    toast.success(t("memberProfile.statusUpdated"));
    setAvailModal(false);
  }

  const areaLabel = profile?.area && profile.area.trim().length > 0 ? profile.area : t("memberProfile.noLocation");
  const availabilityLabel = profile?.isAvailable ? t("memberProfile.available") : t("memberProfile.unavailable");
  const categoryLabel =
    profile && profile.categorySlugs.length > 0
      ? profile.categorySlugs.map((s) => tService(s, categoryBySlug(s)?.name ?? s)).join(", ")
      : t("memberProfile.noCategory");

  return (
    <>
      <header className="bg-success text-success-foreground px-5 pt-8 pb-12 rounded-b-3xl">
        <h1 className="font-serif text-2xl">{t("memberProfile.title")}</h1>
        <p className="text-xs opacity-80">{t("memberProfile.subtitle")}</p>
      </header>

      <div className="px-5 -mt-8">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`size-16 rounded-2xl overflow-hidden ${profile?.avatarUrl ? "" : profile?.tint ?? "bg-secondary"} flex items-center justify-center font-bold text-slate-700 text-lg`}
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="size-full object-cover" />
                ) : (
                  profile?.initials ?? "?"
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label={t("memberProfile.uploading")}
                className="absolute -bottom-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-2 ring-card disabled:opacity-60"
              >
                <Camera className="size-3" />
              </button>
            </div>
            <div className="min-w-0">
              <h2 className="font-bold font-sans truncate">{profile?.name ?? (loading ? t("memberProfile.loading") : "—")}</h2>
              <p className="text-xs text-muted-foreground truncate">{categoryLabel}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold bg-success/15 text-success px-2 py-0.5 rounded-full">
                ✓ {t("memberProfile.verified")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 mt-5 pt-5 border-t border-border text-center">
            <Stat label={t("memberProfile.rating")} value={profile ? profile.rating.toFixed(1) : "0.0"} />
            <Stat label={t("memberProfile.jobs")} value={profile ? String(profile.jobsCount) : "0"} mid />
            <Stat label={t("memberProfile.years")} value={profile?.years != null ? String(profile.years) : "—"} />
          </div>
        </div>
      </div>

      <section className="px-5 mt-6 space-y-2">
        <Row icon={<Briefcase className="size-4" />} label={t("memberProfile.category")} value={categoryLabel} onClick={() => setCatModal(true)} />
        <Row icon={<MapPin className="size-4" />} label={t("memberProfile.serviceArea")} value={areaLabel} onClick={() => setAreaModal(true)} />
        <Row icon={<Clock className="size-4" />} label={t("memberProfile.availability")} value={availabilityLabel} onClick={() => setAvailModal(true)} />
      </section>

      <section className="px-5 mt-6">
        <h3 className="font-bold text-sm font-sans mb-3">{t("memberProfile.recentReviews")}</h3>
        {loading ? (
          <p className="text-xs text-muted-foreground">{t("memberProfile.loading")}</p>
        ) : reviews.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold">{t("memberProfile.noReviews")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("memberProfile.noReviewsSub")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{r.customer_name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3 ${i < r.rating ? "text-accent fill-current" : "text-muted"}`}
                      />
                    ))}
                  </div>
                </div>
                {r.comment ? (
                  <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{r.comment}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic mt-2">—</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 mt-6 pb-6 space-y-2">
        <Link
          to="/member/settings"
          className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3"
        >
          <span className="size-9 rounded-xl bg-secondary flex items-center justify-center">
            <Settings className="size-4" />
          </span>
          <span className="flex-1 text-sm font-semibold text-left">{t("memberProfile.settings")}</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <button
          onClick={handleLogout}
          className="w-full bg-destructive/10 text-destructive flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
        >
          <LogOut className="size-4" /> {t("common.logout")}
        </button>
      </section>

      {catModal && profile && (
        <CategoriesModal
          initial={profile.categorySlugs}
          onClose={() => setCatModal(false)}
          onSave={saveCategories}
        />
      )}
      {areaModal && profile && (
        <AreaModal initial={profile.area} onClose={() => setAreaModal(false)} onSave={saveArea} />
      )}
      {availModal && profile && (
        <AvailabilityModal
          current={profile.isAvailable}
          onClose={() => setAvailModal(false)}
          onSave={saveAvailability}
        />
      )}
    </>
  );
}

function Stat({ label, value, mid }: { label: string; value: string; mid?: boolean }) {
  return (
    <div className={mid ? "border-x border-border" : ""}>
      <p className="text-lg font-bold font-sans">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition"
    >
      <span className="size-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-bold text-lg">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label={t("common.close")} className="size-8 rounded-full hover:bg-secondary flex items-center justify-center">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CategoriesModal({
  initial,
  onClose,
  onSave,
}: {
  initial: string[];
  onClose: () => void;
  onSave: (next: string[]) => void | Promise<void>;
}) {
  const { t, tService } = useI18n();
  const [sel, setSel] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);
  function toggle(slug: string) {
    setSel((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }
  return (
    <ModalShell
      title={t("memberProfile.selectCategoriesTitle")}
      subtitle={t("memberProfile.selectCategoriesSub")}
      onClose={onClose}
    >
      <ul className="space-y-1.5">
        {categories.map((c) => {
          const on = sel.includes(c.slug);
          return (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => toggle(c.slug)}
                className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 border ${on ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="flex-1 text-left text-sm font-semibold">{tService(c.slug, c.name)}</span>
                <span className={`size-5 rounded-md border flex items-center justify-center ${on ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                  {on && <Check className="size-3.5" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await onSave(sel);
          setSaving(false);
        }}
        className="mt-4 w-full bg-foreground text-background py-3.5 rounded-2xl font-bold text-sm disabled:opacity-60"
      >
        {saving ? t("common.saving") : t("common.save")}
      </button>
    </ModalShell>
  );
}

function AreaModal({
  initial,
  onClose,
  onSave,
}: {
  initial: string;
  onClose: () => void;
  onSave: (next: string) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  return (
    <ModalShell
      title={t("memberProfile.editAreaTitle")}
      subtitle={t("memberProfile.editAreaSub")}
      onClose={onClose}
    >
      <CityAutocomplete value={val} onChange={setVal} variant="card" autoFocus />
      <button
        type="button"
        disabled={saving || !val.trim()}
        onClick={async () => {
          setSaving(true);
          await onSave(val);
          setSaving(false);
        }}
        className="mt-4 w-full bg-foreground text-background py-3.5 rounded-2xl font-bold text-sm disabled:opacity-60"
      >
        {saving ? t("common.saving") : t("common.save")}
      </button>
    </ModalShell>
  );
}

function AvailabilityModal({
  current,
  onClose,
  onSave,
}: {
  current: boolean;
  onClose: () => void;
  onSave: (val: boolean) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  async function pick(v: boolean) {
    setSaving(true);
    await onSave(v);
    setSaving(false);
  }
  return (
    <ModalShell title={t("memberProfile.setAvailabilityTitle")} onClose={onClose}>
      <div className="space-y-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => pick(true)}
          className={`w-full flex items-center gap-3 rounded-2xl px-4 py-4 border ${current ? "border-success bg-success/10" : "border-border bg-card"}`}
        >
          <span className="size-3 rounded-full bg-success" />
          <span className="flex-1 text-left font-semibold text-sm">{t("memberProfile.available")}</span>
          {current && <Check className="size-4 text-success" />}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => pick(false)}
          className={`w-full flex items-center gap-3 rounded-2xl px-4 py-4 border ${!current ? "border-destructive bg-destructive/10" : "border-border bg-card"}`}
        >
          <span className="size-3 rounded-full bg-destructive" />
          <span className="flex-1 text-left font-semibold text-sm">{t("memberProfile.unavailable")}</span>
          {!current && <Check className="size-4 text-destructive" />}
        </button>
      </div>
    </ModalShell>
  );
}
