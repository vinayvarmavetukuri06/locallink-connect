import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Wrench, ChevronRight, Users, CalendarCheck, Star, MousePointerClick, UserCheck, Zap } from "lucide-react";

export const Route = createFileRoute("/auth/")({
  component: AuthChooser,
});

function AuthChooser() {
  return (
    <div className="mobile-shell px-5 py-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Choose Account Type</h1>
        <p className="text-sm text-muted-foreground mt-1">How would you like to use LocalConnect?</p>
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
                <h3 className="font-bold text-base font-sans">I Need a Service</h3>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Find nearby workers and book services instantly.
              </p>
              <div className="mt-3 inline-flex items-center text-xs font-bold text-primary">
                Continue as User →
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
                <h3 className="font-bold text-base font-sans">I Provide Services</h3>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Get customers and grow your local business.
              </p>
              <div className="mt-3 inline-flex items-center text-xs font-bold text-success">
                Continue as Member →
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Trust stats */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { icon: <Users className="size-4" />, value: "10,000+", label: "Workers" },
          { icon: <CalendarCheck className="size-4" />, value: "50,000+", label: "Bookings" },
          { icon: <Star className="size-4 fill-current" />, value: "4.8★", label: "Rating" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <div className="mx-auto size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1.5">
              {s.icon}
            </div>
            <p className="text-sm font-bold font-sans leading-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-8">
        <h2 className="font-bold text-sm font-sans uppercase tracking-wider text-muted-foreground mb-3">How it works</h2>
        <div className="space-y-2.5">
          {[
            { icon: <MousePointerClick className="size-4" />, title: "Choose a service", desc: "Pick from 12+ local services." },
            { icon: <UserCheck className="size-4" />, title: "Pick a worker", desc: "Compare ratings and prices." },
            { icon: <Zap className="size-4" />, title: "Book instantly", desc: "Confirm in seconds, get help fast." },
          ].map((s, i) => (
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

      <div className="mt-10 text-center">
        <Link to="/admin" className="text-xs text-muted-foreground underline">
          Admin Panel
        </Link>
      </div>
    </div>
  );
}
