import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Wrench, ChevronRight, Users, CalendarCheck, Star, MousePointerClick, UserCheck, Zap } from "lucide-react";
import { LanguageButton } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth/")({
  component: AuthChooser,
});

function AuthChooser() {
  const { t } = useI18n();
  const steps = [
    { icon: <MousePointerClick className="size-4" />, title: t("auth.chooser.step1Title"), desc: t("auth.chooser.step1Desc") },
    { icon: <UserCheck className="size-4" />, title: t("auth.chooser.step2Title"), desc: t("auth.chooser.step2Desc") },
    { icon: <Zap className="size-4" />, title: t("auth.chooser.step3Title"), desc: t("auth.chooser.step3Desc") },
  ];
  const stats = [
    { icon: <Users className="size-4" />, value: "10,000+", label: t("auth.chooser.workers") },
    { icon: <CalendarCheck className="size-4" />, value: "50,000+", label: t("auth.chooser.bookings") },
    { icon: <Star className="size-4 fill-current" />, value: "4.8★", label: t("auth.chooser.rating") },
  ];
  return (
    <div className="mobile-shell px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("auth.back")}
        </Link>
        <LanguageButton />
      </div>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight">{t("auth.chooser.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auth.chooser.subtitle")}</p>
      </div>

      <div className="space-y-4">
        <Link
          to="/auth/user"
          className="block bg-card p-5 rounded-3xl border border-border hover:border-primary/40 active:scale-[0.99] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Search className="size-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base font-sans">{t("auth.chooser.userTitle")}</h3>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("auth.chooser.userDesc")}</p>
              <div className="mt-3 inline-flex items-center text-xs font-bold text-primary">
                {t("auth.chooser.userCta")}
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/auth/member"
          className="block bg-card p-5 rounded-3xl border border-border hover:border-primary/40 active:scale-[0.99] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-2xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <Wrench className="size-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base font-sans">{t("auth.chooser.memberTitle")}</h3>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("auth.chooser.memberDesc")}</p>
              <div className="mt-3 inline-flex items-center text-xs font-bold text-success">
                {t("auth.chooser.memberCta")}
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <div className="mx-auto size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1.5">
              {s.icon}
            </div>
            <p className="text-sm font-bold font-sans leading-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-bold text-sm font-sans uppercase tracking-wider text-muted-foreground mb-3">
          {t("auth.chooser.howItWorks")}
        </h2>
        <div className="space-y-2.5">
          {steps.map((s, i) => (
            <div key={s.title} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                {s.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold font-sans">{i + 1}. {s.title}</p>
                <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
