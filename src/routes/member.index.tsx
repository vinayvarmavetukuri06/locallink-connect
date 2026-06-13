import { createFileRoute, Link } from "@tanstack/react-router";
import { currentMember, bookings } from "@/lib/mock-data";
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
          <div className="flex items-center gap-2">
            <AvailabilityPill />
            <button className="size-10 rounded-full bg-background/10 backdrop-blur-md flex items-center justify-center relative">
              <Bell className="size-4" />
              <span className="absolute top-2.5 right-2.5 size-2 bg-warning rounded-full ring-2 ring-primary" />
            </button>
          </div>
        </div>
      </header>


      {/* Stats overlay */}
      <div className="px-5">
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

function AvailabilityPill() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<boolean | null>(null);

  const workerUserId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  useEffect(() => {
    if (!workerUserId) { setAvailable(true); return; }
    (async () => {
      const { data } = await supabase
        .from("worker_profiles")
        .select("id, is_available")
        .eq("user_id", workerUserId)
        .maybeSingle();
      if (data) {
        setRowId(data.id);
        setAvailable(data.is_available);
      } else {
        setAvailable(true);
      }
    })();
  }, [workerUserId]);

  const isOn = available ?? true;

  async function confirm() {
    if (pending === null || saving) return;
    setSaving(true);
    setAvailable(pending);

    if (rowId) {
      const { error } = await supabase
        .from("worker_profiles")
        .update({ is_available: pending })
        .eq("id", rowId);
      if (error) {
        setAvailable(!pending);
        toast.error("Couldn't update availability");
        setSaving(false);
        return;
      }
    }

    if (!pending && workerUserId) {
      const { data: cancelled } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("worker_id", workerUserId)
        .in("status", ["accepted", "in_progress"])
        .select("id");
      if (cancelled && cancelled.length > 0) {
        toast.warning(`${cancelled.length} active booking(s) were cancelled and customers were notified.`);
      }
    }

    toast.success(pending ? "You're now Available" : "You're now Unavailable");
    setSaving(false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => {
          setPending(isOn);
          setOpen(true);
        }}
        disabled={available === null}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-opacity disabled:opacity-60 ${
          isOn ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
        }`}
      >
        <span className={`size-2 rounded-full ${isOn ? "bg-success" : "bg-destructive"}`} />
        {isOn ? "Available" : "Unavailable"}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="text-left">
            <SheetTitle className="font-serif text-xl">Update Availability</SheetTitle>
            <SheetDescription className="text-xs">
              Choose your current working status. Going unavailable will cancel your active bookings.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-3">
            <label
              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                pending === true ? "border-success bg-success/10" : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                name="availability"
                className="sr-only"
                checked={pending === true}
                onChange={() => setPending(true)}
              />
              <span className="size-3 rounded-full bg-success shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold font-sans">Set as Available</p>
                <p className="text-[11px] text-muted-foreground">You'll appear in customer searches and can accept new jobs.</p>
              </div>
              {pending === true && (
                <CircleCheck className="size-5 text-success shrink-0" />
              )}
            </label>

            <label
              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${
                pending === false ? "border-destructive bg-destructive/10" : "border-border bg-card"
              }`}
            >
              <input
                type="radio"
                name="availability"
                className="sr-only"
                checked={pending === false}
                onChange={() => setPending(false)}
              />
              <span className="size-3 rounded-full bg-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold font-sans">Set as Unavailable</p>
                <p className="text-[11px] text-muted-foreground">You'll be hidden from searches and active bookings will be cancelled.</p>
              </div>
              {pending === false && (
                <CircleCheck className="size-5 text-destructive shrink-0" />
              )}
            </label>

            <button
              onClick={confirm}
              disabled={saving || pending === null || pending === isOn}
              className="w-full mt-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Confirm"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
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
