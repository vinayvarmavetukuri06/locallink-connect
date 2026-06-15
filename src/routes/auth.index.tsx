import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Wrench, ChevronRight, Check } from "lucide-react";
import { LanguageButton } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth/")({
  component: AuthChooser,
});

function AuthChooser() {
  const { t } = useI18n();
  return (
    <div className="mobile-shell px-5 py-6 flex flex-col min-h-[100dvh]">
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

      {/* Primary card — I Need a Service */}
      <Link
        to="/auth/user"
        className="block bg-primary/[0.04] border border-primary/20 p-6 rounded-3xl hover:border-primary/40 active:scale-[0.99] transition-all"
      >
        <div className="flex items-start gap-5">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Search className="size-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-0.5">
              {t("auth.chooser.userLabel")}
            </p>
            <h3 className="font-bold text-lg font-sans leading-tight">{t("auth.chooser.userTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("auth.chooser.userDesc")}</p>
          </div>
        </div>

        {/* How it works mini steps */}
        <div className="mt-5 pt-5 border-t border-primary/10">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-2">
            {t("auth.chooser.howItWorks")}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3 text-primary" />
              {t("auth.chooser.step1Title")}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3 text-primary" />
              {t("auth.chooser.step2Title")}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="size-3 text-primary" />
              {t("auth.chooser.step3Title")}
            </span>
          </div>
        </div>

        {/* Big prominent CTA button */}
        <div className="mt-5">
          <div className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-sm">
            {t("auth.chooser.userCta")}
            <ChevronRight className="size-5" />
          </div>
        </div>
      </Link>

      {/* Spacer pushes member option to bottom */}
      <div className="flex-1 min-h-8" />

      {/* Tiny secondary option — I Provide Services */}
      <Link
        to="/auth/member"
        className="flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Wrench className="size-3.5" />
        <span className="text-xs font-medium">{t("auth.chooser.memberCta")}</span>
      </Link>
    </div>
  );
}
