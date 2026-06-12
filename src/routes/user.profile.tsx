import { createFileRoute, Link } from "@tanstack/react-router";
import { currentUser, bookings } from "@/lib/mock-data";
import { ChevronRight, Heart, Star, Clock, LogOut, MapPin, Phone, Settings } from "lucide-react";

export const Route = createFileRoute("/user/profile")({
  component: UserProfile,
});

function UserProfile() {
  return (
    <>
      <header className="bg-primary text-primary-foreground px-5 pt-8 pb-20 rounded-b-3xl min-h-[160px]">
        <h1 className="font-serif text-2xl">Profile</h1>
      </header>

      <div className="px-5 -mt-16">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
              RS
            </div>
            <div>
              <h2 className="font-bold font-sans">{currentUser.name}</h2>
              <p className="text-xs text-muted-foreground">{currentUser.mobile}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="size-3" /> {currentUser.location}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 mt-5 pt-5 border-t border-border text-center">
            <div>
              <p className="text-lg font-bold font-sans">{bookings.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Bookings</p>
            </div>
            <div className="border-x border-border">
              <p className="text-lg font-bold font-sans">4</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Reviews</p>
            </div>
            <div>
              <p className="text-lg font-bold font-sans">3</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Saved</p>
            </div>
          </div>
        </div>
      </div>

      <section className="px-5 mt-6 space-y-2">
        <Row icon={<Heart className="size-4" />} label="Saved Workers" badge="3" />
        <Row icon={<Star className="size-4" />} label="My Reviews" badge="4" />
        <Row icon={<Clock className="size-4" />} label="Booking History" />
        <Row icon={<Phone className="size-4" />} label="Help & Support" />
        <Row icon={<Settings className="size-4" />} label="Settings" />
      </section>

      <section className="px-5 mt-6 pb-6">
        <Link
          to="/"
          className="w-full bg-destructive/10 text-destructive flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
        >
          <LogOut className="size-4" /> Logout
        </Link>
      </section>
    </>
  );
}

function Row({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <button className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-secondary transition-colors">
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
    </button>
  );
}
