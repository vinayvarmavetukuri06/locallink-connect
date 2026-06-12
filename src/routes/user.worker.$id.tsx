import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { workerById, categoryBySlug, reviews } from "@/lib/mock-data";
import { WorkerAvatar } from "@/components/worker-card";
import { ArrowLeft, BadgeCheck, Crown, Star, MapPin, MessageCircle, Phone, Calendar, Clock, MapPinned, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/lib/profile-store";

export const Route = createFileRoute("/user/worker/$id")({
  component: WorkerProfile,
});

function WorkerProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const userProfile = useUserProfile();
  const w = workerById(id);
  const cat = w ? categoryBySlug(w.category) : undefined;
  const workerReviews = reviews.filter((r) => r.workerId === id);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState(userProfile.location ?? "");
  const [savedBooking, setSavedBooking] = useState<{
    id?: string;
    service: string;
    date: string;
    time: string;
    address: string;
    problem: string;
    amount: number;
  } | null>(null);

  const TIME_SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];

  async function handleConfirm() {
    if (!w) return;
    setErrMsg(null);
    if (!date || !time || !address.trim() || !problem.trim()) {
      setErrMsg("Please fill date, time, address, and problem description.");
      return;
    }
    setSubmitting(true);
    const customerId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;
    const payload = {
      customer_id: customerId,
      worker_id: null as string | null,
      service: w.trade,
      date,
      time,
      address,
      problem_description: problem,
      status: "pending",
      amount: w.startingPrice,
    };
    const { data, error } = await supabase.from("bookings").insert(payload).select("id").maybeSingle();
    setSubmitting(false);
    if (error) {
      setErrMsg(error.message);
      return;
    }
    setSavedBooking({
      id: data?.id,
      service: w.trade,
      date,
      time,
      address,
      problem,
      amount: w.startingPrice,
    });
    setConfirmed(true);
  }

  if (!w) return <div className="p-5">Worker not found. <Link to="/user" className="text-primary">Home</Link></div>;

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-4 sticky top-0 z-30 border-b border-border">
        <Link to="/user" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </header>

      <section className="px-5 py-6">
        <div className="flex items-start gap-4">
          <WorkerAvatar worker={w} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-serif text-2xl">{w.name}</h1>
              {w.verified && <BadgeCheck className="size-5 text-primary" />}
              {w.premium && <Crown className="size-5 text-accent" />}
            </div>
            <p className="text-sm text-muted-foreground">{w.trade}</p>
            <div className="flex items-center gap-3 text-xs mt-2">
              <div className="flex items-center gap-1">
                <Star className="size-3.5 text-accent fill-current" />
                <span className="font-bold">{w.rating}</span>
                <span className="text-muted-foreground">({w.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5" /> {w.distanceKm}km
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Experience" value={`${w.experience} yrs`} />
          <Stat label="Starts at" value={`₹${w.startingPrice}`} />
          <Stat label="Jobs done" value={`${w.reviews}+`} />
        </div>

        <div className="mt-6">
          <h3 className="font-bold text-sm font-sans mb-2">About</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{w.bio}</p>
        </div>

        <div className="mt-6 bg-secondary rounded-2xl p-4">
          <h3 className="font-bold text-sm font-sans mb-1">Service Area</h3>
          <p className="text-sm text-muted-foreground">{w.area} • {cat?.name}</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm font-sans">Reviews ({workerReviews.length})</h3>
            <button className="text-xs text-primary font-bold">View all</button>
          </div>
          <div className="space-y-3">
            {workerReviews.map((r) => (
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
                <p className="text-[10px] text-muted-foreground mt-1">{r.date}</p>
              </div>
            ))}
            {workerReviews.length === 0 && (
              <p className="text-xs text-muted-foreground">No reviews yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Sticky CTAs */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-2 z-40">
        <div className="bg-card border border-border rounded-3xl p-3 shadow-lg shadow-black/5 flex gap-2">
          <button className="size-12 rounded-2xl bg-secondary flex items-center justify-center">
            <Phone className="size-5" />
          </button>
          <button
            onClick={() => navigate({ to: "/user/chat" })}
            className="size-12 rounded-2xl bg-secondary flex items-center justify-center"
          >
            <MessageCircle className="size-5" />
          </button>
          <button
            onClick={() => setBookingOpen(true)}
            className="flex-1 bg-primary text-primary-foreground rounded-2xl font-bold text-sm"
          >
            Book Now · ₹{w.startingPrice}
          </button>
        </div>
      </div>

      {bookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setBookingOpen(false)}>
          <div
            className="w-full max-w-md mx-auto bg-card rounded-t-3xl p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            {!confirmed ? (
              <>
                <div className="size-10 h-1.5 bg-border rounded-full mx-auto mb-4" />
                <h2 className="font-serif text-2xl">Book {w.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{w.trade}</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      Describe your problem
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. AC not cooling properly"
                      className="mt-2 w-full bg-secondary rounded-2xl p-3 text-sm outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Date
                      </label>
                      <input type="date" className="mt-2 w-full bg-secondary rounded-2xl px-3 py-3 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Time
                      </label>
                      <input type="time" className="mt-2 w-full bg-secondary rounded-2xl px-3 py-3 text-sm outline-none" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setConfirmed(true)}
                  className="mt-6 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold"
                >
                  Confirm Booking · ₹{w.startingPrice}
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="size-16 mx-auto bg-success/15 text-success rounded-full flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h2 className="font-serif text-2xl mt-4">Booking Sent!</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {w.name} will confirm shortly. Track it under My Bookings.
                </p>
                <button
                  onClick={() => navigate({ to: "/user/bookings" })}
                  className="mt-6 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold"
                >
                  View My Bookings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded-2xl p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-sm mt-0.5 font-sans">{value}</p>
    </div>
  );
}
