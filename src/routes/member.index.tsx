import { createFileRoute, Link } from "@tanstack/react-router";
import { currentMember, bookings, workerById } from "@/lib/mock-data";
import {
  Bell,
  IndianRupee,
  Calendar,
  TrendingUp,
  Crown,
  ChevronRight,
  CircleCheck,
  CircleAlert,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/member/")({
  component: MemberHome,
});

function MemberHome() {
  return (
    <>
      <header className="bg-primary text-primary-foreground px-5 pt-6 pb-16 rounded-b-3xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80 uppercase tracking-wider font-medium">Welcome back,</p>
            <h1 className="font-serif text-2xl mt-0.5">{currentMember.name}</h1>
            <p className="text-xs opacity-80 mt-0.5">{currentMember.category} · {currentMember.area.split(",")[0]}</p>
          </div>
          <button className="size-10 rounded-full bg-background/10 backdrop-blur-md flex items-center justify-center relative">
            <Bell className="size-4" />
            <span className="absolute top-2.5 right-2.5 size-2 bg-warning rounded-full ring-2 ring-primary" />
          </button>
        </div>
      </header>

      <AvailabilityToggle />


      {/* Stats overlay */}
      <div className="px-5 -mt-12">
        <div className="bg-card border border-border rounded-3xl p-4 grid grid-cols-2 gap-3 shadow-md">
          <Metric
            label="Total Bookings"
            value={String(currentMember.monthlyBookings)}
            sub="this month"
            icon={<Calendar className="size-4" />}
            tint="bg-primary/10 text-primary"
          />
          <Metric
            label="Earnings"
            value={`₹${currentMember.monthlyEarnings.toLocaleString("en-IN")}`}
            sub="this month"
            icon={<IndianRupee className="size-4" />}
            tint="bg-success/15 text-success"
          />
        </div>
      </div>

      {/* Plan Card */}
      <section className="px-5 mt-5">
        <Link
          to="/member/membership"
          className="block bg-gradient-to-br from-accent to-accent/70 text-accent-foreground rounded-3xl p-5 shadow-lg shadow-accent/20"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1 bg-accent-foreground/15 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                <Crown className="size-3" />
                {currentMember.plan}
              </div>
              <p className="font-serif text-2xl mt-2">Plan Active</p>
              <p className="text-xs opacity-80 mt-0.5">
                {currentMember.daysRemaining} days remaining
              </p>
            </div>
            <ChevronRight className="size-5" />
          </div>
          <div className="mt-4 h-1.5 bg-accent-foreground/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-foreground rounded-full"
              style={{ width: `${(currentMember.daysRemaining / 30) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-3 font-semibold uppercase tracking-wide">
            <span>Renew anytime</span>
            <span>Upgrade →</span>
          </div>
        </Link>
      </section>

      {/* Pending Requests */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg font-sans">Customer Requests</h2>
          <span className="text-[10px] font-bold bg-warning/15 text-warning px-2 py-0.5 rounded-full">
            {currentMember.pendingRequests} NEW
          </span>
        </div>
        <div className="space-y-3">
          {bookings.filter((b) => b.status === "pending" || b.status === "accepted").slice(0, 3).map((b) => (
            <RequestCard key={b.id} bookingId={b.id} />
          ))}
        </div>
      </section>

      {/* Tip */}
      <section className="px-5 mt-6 mb-4">
        <div className="bg-secondary rounded-2xl p-4 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <p className="font-bold text-sm font-sans">You're trending in your area!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              +18% bookings vs last week. Reply faster to boost ranking.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
  tint,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <div className="bg-secondary/50 rounded-2xl p-3">
      <div className={`size-8 rounded-xl flex items-center justify-center ${tint}`}>{icon}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-2">{label}</p>
      <p className="font-bold text-lg font-sans leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function RequestCard({ bookingId }: { bookingId: string }) {
  const b = bookings.find((x) => x.id === bookingId)!;
  const [state, setState] = useState<"open" | "accepted" | "rejected">("open");

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-sm font-sans">{b.customerName}</p>
          <p className="text-[11px] text-muted-foreground">{b.customerAddress}</p>
        </div>
        <span className="text-xs font-bold text-primary">₹{b.amount}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{b.description}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{b.date} · {b.time}</p>

      {state === "open" ? (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setState("rejected")}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-secondary"
          >
            Reject
          </button>
          <button
            onClick={() => setState("accepted")}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-success text-success-foreground"
          >
            Accept
          </button>
        </div>
      ) : state === "accepted" ? (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-success font-bold">
          <CircleCheck className="size-4" /> Accepted — visit on {b.date}
        </div>
      ) : (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-destructive font-bold">
          <CircleAlert className="size-4" /> Rejected
        </div>
      )}
    </div>
  );
}
