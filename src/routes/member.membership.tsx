import { createFileRoute } from "@tanstack/react-router";
import { currentMember } from "@/lib/mock-data";
import { Check, Crown, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: 200,
    features: [
      "Listed in the app",
      "Unlimited bookings",
      "Customer reviews",
      "Basic profile",
    ],
    cta: "Choose Basic",
    highlight: false,
  },
  {
    name: "Premium",
    price: 499,
    features: [
      "Featured listing",
      "Priority ranking in search",
      "Premium badge on profile",
      "More visibility = more bookings",
      "Priority customer support",
    ],
    cta: "Upgrade to Premium",
    highlight: true,
  },
];

export const Route = createFileRoute("/member/membership")({
  component: Membership,
});

function Membership() {
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">Membership</h1>
        <p className="text-xs text-muted-foreground">Choose a plan that grows your business</p>
      </header>

      <div className="px-5 pt-5">
        <div className="bg-foreground text-background rounded-3xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Crown className="size-4 text-accent" />
            CURRENT PLAN
          </div>
          <p className="font-serif text-3xl mt-2">{currentMember.plan} — Active</p>
          <p className="text-xs opacity-70 mt-1">
            {currentMember.daysRemaining} days left · Renews automatically via Razorpay
          </p>
          <button className="mt-4 bg-background/15 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold">
            Renew Now
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
                      Popular
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${p.highlight ? "opacity-80" : "text-muted-foreground"}`}>
                  per month, billed monthly
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
        Secure payments powered by Razorpay
      </p>
    </>
  );
}
