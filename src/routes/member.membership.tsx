import { createFileRoute } from "@tanstack/react-router";
import { currentMember } from "@/lib/mock-data";
import { Check, Crown, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/member/membership")({
  component: Membership,
});

function Membership() {
  const { t } = useI18n();
  const plans = [
    {
      name: t("membership.basic"),
      price: 200,
      features: [t("membership.f1"), t("membership.f2"), t("membership.f3"), t("membership.f4")],
      cta: t("membership.chooseBasic"),
      highlight: false,
    },
    {
      name: t("membership.premium"),
      price: 499,
      features: [t("membership.fp1"), t("membership.fp2"), t("membership.fp3"), t("membership.fp4"), t("membership.fp5")],
      cta: t("membership.upgradePremium"),
      highlight: true,
    },
  ];
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">{t("membership.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("membership.subtitle")}</p>
      </header>

      <div className="px-5 pt-5">
        <div className="bg-foreground text-background rounded-3xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Crown className="size-4 text-accent" />
            {t("membership.currentPlan")}
          </div>
          <p className="font-serif text-3xl mt-2">{currentMember.plan} — {t("membership.active")}</p>
          <p className="text-xs opacity-70 mt-1">
            {currentMember.daysRemaining} {t("membership.daysLeft")}
          </p>
          <button className="mt-4 bg-background/15 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold">
            {t("membership.renewNow")}
          </button>
        </div>
      </div>

      <section className="px-5 py-6 space-y-4">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-3xl p-5 border-2 ${
              p.highlight
                ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20"
                : "bg-card border-border"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl">{p.name}</h3>
                  {p.highlight && (
                    <span className="text-[10px] font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded-full uppercase">
                      {t("membership.popular")}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${p.highlight ? "opacity-80" : "text-muted-foreground"}`}>
                  {t("membership.perMonth")}
                </p>
              </div>
              <p className="font-bold text-2xl font-sans">
                ₹{p.price}
                <span className={`text-xs font-medium ${p.highlight ? "opacity-70" : "text-muted-foreground"}`}>/mo</span>
              </p>
            </div>
            <ul className="mt-4 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className={`size-4 mt-0.5 shrink-0 ${p.highlight ? "" : "text-success"}`} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              className={`mt-5 w-full py-3.5 rounded-2xl font-bold text-sm ${
                p.highlight
                  ? "bg-background text-foreground"
                  : "bg-foreground text-background"
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-muted-foreground px-10 pb-6 flex items-center justify-center gap-1">
        <Sparkles className="size-3" />
        {t("membership.secure")}
      </p>
    </>
  );
}
