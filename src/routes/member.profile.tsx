import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Star, Camera, MapPin, IndianRupee, Briefcase, Clock, Settings, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoryBySlug } from "@/lib/mock-data";
import { initialsFromName, tintFromId } from "@/lib/workers-api";
import { clearSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/member/profile")({
  component: MemberProfile,
});

type Profile = {
  name: string;
  area: string;
  categorySlug: string;
  categoryName: string;
  hourlyRate: number | null;
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
  // Already a full URL (legacy)
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
        .select("id, service_category, hourly_rate, years_of_experience, is_available")
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

    const name = prof?.full_name ?? "";
    const slug = wp?.service_category ?? "";
    const avatarUrl = await signedAvatarUrl((prof as any)?.avatar_url ?? null);
    const next: Profile = {
      name,
      area: prof?.location ?? "",
      categorySlug: slug,
      categoryName: tService(slug, categoryBySlug(slug)?.name) || "—",
      hourlyRate: wp?.hourly_rate != null ? Number(wp.hourly_rate) : null,
      years: wp?.years_of_experience ?? null,
      rating: avgRating,
      jobsCount: jobsCount ?? 0,
      isAvailable: wp?.is_available ?? true,
      avatarUrl,
      initials: initialsFromName(name),
      tint: tintFromId(workerUserId),
    };
    const mappedReviews: Review[] = reviewsArr.map((r) => ({
      id: r.id,
      rating: r.rating ?? 0,
      comment: r.comment,
      customer_name: (r.customer_id && nameMap.get(r.customer_id)) || t("memberHome.customer"),
      created_at: r.created_at,
    }));
    setProfile(next);
    setReviews(mappedReviews);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadProfile();
      } catch (e) {
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

  const areaLabel = profile?.area && profile.area.trim().length > 0 ? profile.area : t("memberProfile.noLocation");
  const availabilityLabel = profile?.isAvailable ? t("memberProfile.available") : t("memberProfile.unavailable");

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
              <p className="text-xs text-muted-foreground truncate">{profile?.categoryName ?? "—"}</p>
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
        <Row icon={<Briefcase className="size-4" />} label={t("memberProfile.category")} value={profile?.categoryName ?? "—"} />
        <Row
          icon={<IndianRupee className="size-4" />}
          label={t("memberProfile.startingPrice")}
          value={profile?.hourlyRate != null ? `₹${profile.hourlyRate}/hr` : "—"}
        />
        <Row icon={<MapPin className="size-4" />} label={t("memberProfile.serviceArea")} value={areaLabel} />
        <Row icon={<Clock className="size-4" />} label={t("memberProfile.availability")} value={availabilityLabel} />
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
                {r.comment && <p className="text-xs text-muted-foreground mt-1.5">{r.comment}</p>}
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

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3">
      <span className="size-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </div>
  );
}
