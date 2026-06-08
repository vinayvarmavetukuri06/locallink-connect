import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  return (
    <div className="mobile-shell flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="size-24 rounded-3xl bg-background/15 backdrop-blur-md ring-1 ring-background/20 flex items-center justify-center shadow-2xl">
          <MapPin className="size-12 text-background" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-serif text-5xl font-bold leading-none">LocalConnect</h1>
          <p className="mt-3 text-background/80 text-base max-w-[14ch] mx-auto leading-snug">
            Find Trusted Local Workers Near You
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-background/70 mt-4">
          <Sparkles className="size-3.5" />
          <span>10,000+ verified workers across India</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        <Link
          to="/auth"
          className="w-full bg-background text-primary text-center py-4 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
        >
          Get Started
        </Link>
        <Link
          to="/auth"
          className="w-full bg-background/10 backdrop-blur-md text-background text-center py-4 rounded-2xl font-bold text-base ring-1 ring-background/20 active:scale-[0.98] transition-transform"
        >
          I have an account · Login
        </Link>
        <p className="text-center text-xs text-background/60 mt-2">
          By continuing you agree to our Terms & Privacy
        </p>
      </div>
    </div>
  );
}
