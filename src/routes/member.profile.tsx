import { createFileRoute, Link } from "@tanstack/react-router";
import { currentMember, reviews } from "@/lib/mock-data";
import { ChevronRight, Star, Camera, MapPin, IndianRupee, Briefcase, Clock, Settings, LogOut } from "lucide-react";

export const Route = createFileRoute("/member/profile")({
  component: MemberProfile,
});

function MemberProfile() {
  const myReviews = reviews.filter((r) => r.workerId === currentMember.id);
  return (
    <>
      <header className="bg-success text-success-foreground px-5 pt-8 pb-12 rounded-b-3xl">
        <h1 className="font-serif text-2xl">My Profile</h1>
        <p className="text-xs opacity-80">Manage your worker listing</p>
      </header>

      <div className="px-5 -mt-8">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="size-16 rounded-2xl bg-blue-200 flex items-center justify-center font-bold text-slate-700 text-lg">
                AK
              </div>
              <button className="absolute -bottom-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-2 ring-card">
                <Camera className="size-3" />
              </button>
            </div>
            <div>
              <h2 className="font-bold font-sans">{currentMember.name}</h2>
              <p className="text-xs text-muted-foreground">{currentMember.category}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold bg-success/15 text-success px-2 py-0.5 rounded-full">
                ✓ Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 mt-5 pt-5 border-t border-border text-center">
            <Stat label="Rating" value="4.9" />
            <Stat label="Jobs" value="152" mid />
            <Stat label="Years" value="10" />
          </div>
        </div>
      </div>

      <section className="px-5 mt-6 space-y-2">
        <Row icon={<Briefcase className="size-4" />} label="Service Category" value={currentMember.category} />
        <Row icon={<IndianRupee className="size-4" />} label="Starting Price" value="₹249" />
        <Row icon={<MapPin className="size-4" />} label="Service Area" value={currentMember.area} />
        <Row icon={<Clock className="size-4" />} label="Availability" value="Mon–Sat, 9 AM – 8 PM" />
      </section>

      <section className="px-5 mt-6">
        <h3 className="font-bold text-sm font-sans mb-3">Recent Reviews</h3>
        <div className="space-y-3">
          {myReviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{r.customerName}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-3 ${i < r.rating ? "text-accent fill-current" : "text-muted"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 mt-6 pb-6 space-y-2">
        <button className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <span className="size-9 rounded-xl bg-secondary flex items-center justify-center">
            <Settings className="size-4" />
          </span>
          <span className="flex-1 text-sm font-semibold text-left">Settings</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
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
