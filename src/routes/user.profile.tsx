import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ChevronRight, Heart, Star, Clock, LogOut, MapPin, Phone, Settings } from "lucide-react";
import { clearSession, getSession } from "@/lib/session";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/user/profile")({
  component: UserProfile,
});

type ProfileData = {
  name: string;
  mobile: string;
  location: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserProfile() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  const customerId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  async function loadProfile() {
    const session = getSession();
    if (!session?.userId && !customerId) {
      setLoading(false);
      return;
    }
    const id = customerId ?? session!.userId;

    const [{ data: profileData }, { count: bookingsCnt }, { count: reviewsCnt }, { count: savedCnt }] = await Promise.all([
      supabase.from("profiles").select("full_name, mobile, location").eq("id", id).maybeSingle(),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("customer_id", id),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("customer_id", id),
      (supabase as any).from("saved_workers").select("*", { count: "exact", head: true }).eq("customer_id", id),
    ]);

    if (profileData) {
      setProfile({
        name: profileData.full_name ?? session?.name ?? "",
        mobile: profileData.mobile ?? session?.mobile ?? "—",
        location: profileData.location ?? "—",
      });
    } else if (session) {
      setProfile({
        name: session.name,
        mobile: session.mobile,
        location: "—",
      });
    }

    setBookingsCount(bookingsCnt ?? 0);
    setReviewsCount(reviewsCnt ?? 0);
    setSavedCount(savedCnt ?? 0);

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();

    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (customerId) {
      channels.push(supabase.channel("profile-bookings").on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `customer_id=eq.${customerId}` }, () => loadProfile()).subscribe());
      channels.push(supabase.channel("profile-reviews").on("postgres_changes", { event: "*", schema: "public", table: "reviews", filter: `customer_id=eq.${customerId}` }, () => loadProfile()).subscribe());
      channels.push(supabase.channel("profile-saved").on("postgres_changes", { event: "*", schema: "public", table: "saved_workers", filter: `customer_id=eq.${customerId}` }, () => loadProfile()).subscribe());
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  function handleLogout() {
    clearSession();
    navigate({ to: "/" });
  }

  const displayName = profile?.name ?? t("common.dash");
  const initials = profile?.name ? getInitials(profile.name) : "—";

  return (
    <>
      <header className="bg-primary text-primary-foreground px-5 pt-8 pb-20 rounded-b-3xl min-h-[160px]">
        <h1 className="font-serif text-2xl">{t("profile.title")}</h1>
      </header>

      <div className="px-5 -mt-16">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
              {loading ? <Loader2 className="size-5 animate-spin" /> : initials}
            </div>
            <div>
              <h2 className="font-bold font-sans">{displayName}</h2>
              <p className="text-xs text-muted-foreground">{profile?.mobile ?? "—"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="size-3" /> {profile?.location ?? "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 mt-5 pt-5 border-t border-border text-center">
            <div>
              <p className="text-lg font-bold font-sans">{loading ? "—" : bookingsCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("profile.bookings")}</p>
            </div>
            <div className="border-x border-border">
              <p className="text-lg font-bold font-sans">{loading ? "—" : reviewsCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("profile.reviews")}</p>
            </div>
            <div>
              <p className="text-lg font-bold font-sans">{loading ? "—" : savedCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("profile.saved")}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="px-5 mt-6 space-y-2">
        <Row to="/user/saved" icon={<Heart className="size-4" />} label={t("profile.savedWorkers")} badge={loading ? undefined : String(savedCount)} />
        <Row to="/user/reviews" icon={<Star className="size-4" />} label={t("profile.myReviews")} badge={loading ? undefined : String(reviewsCount)} />
        <Row to="/user/history" icon={<Clock className="size-4" />} label={t("profile.bookingHistory")} />
        <Row to="/user/help" icon={<Phone className="size-4" />} label={t("profile.helpSupport")} />
        <Row to="/user/settings" icon={<Settings className="size-4" />} label={t("profile.settings")} />
      </section>

      <section className="px-5 mt-6 pb-6">
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

function Row({ icon, label, badge, to }: { icon: React.ReactNode; label: string; badge?: string; to: string }) {
  return (
    <Link
      to={to}
      className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-secondary transition-colors"
    >
      <span className="size-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold text-left">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
