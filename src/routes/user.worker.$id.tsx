import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { categoryBySlug } from "@/lib/mock-data";
import { WorkerAvatar, AvailabilityBadge } from "@/components/worker-card";
import { useWorkerById } from "@/lib/workers-api";
import { ArrowLeft, Star, MapPin, MessageCircle, Phone, Calendar, Clock, MapPinned, FileText, Loader2 } from "lucide-react";
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
  const { worker: w, loading } = useWorkerById(id);
  const cat = w ? categoryBySlug(w.category) : undefined;
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
      worker_id: w.id,
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

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (!w) {
    return (
      <div className="p-5">
        Worker not found. <Link to="/user" className="text-primary">Home</Link>
      </div>
    );
  }

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
            <h1 className="font-serif text-2xl">{w.name}</h1>
            <p className="text-sm text-muted-foreground">{w.trade}</p>
            <div className="flex items-center gap-3 text-xs mt-2">
              <div className="flex items-center gap-1">
                <Star className="size-3.5 text-accent fill-current" />
                <span className="font-bold">{w.rating.toFixed(1)}</span>
              </div>
              {w.area && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-3.5" /> {w.area}
                </div>
              )}
              <AvailabilityBadge available={w.available} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat label="Experience" value={`${w.experience} yrs`} />
          <Stat label="Hourly" value={`₹${w.startingPrice}`} />
          <Stat label="Rating" value={w.rating.toFixed(1)} />
        </div>

        {w.bio && (
          <div className="mt-6">
            <h3 className="font-bold text-sm font-sans mb-2">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{w.bio}</p>
          </div>
        )}

        <div className="mt-6 bg-secondary rounded-2xl p-4">
          <h3 className="font-bold text-sm font-sans mb-1">Service Area</h3>
          <p className="text-sm text-muted-foreground">{w.area || "—"}{cat ? ` • ${cat.name}` : ""}</p>
        </div>
      </section>

      {/* Sticky CTAs */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-2 z-40">
        <div className="bg-card border border-border rounded-3xl p-3 shadow-lg shadow-black/5 flex gap-2">
          <a
            href={w.mobile ? `tel:${w.mobile.replace(/\s+/g, "")}` : undefined}
            className="size-12 rounded-2xl bg-secondary flex items-center justify-center"
          >
            <Phone className="size-5" />
          </a>
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => { setBookingOpen(false); }}>
          <div
            className="w-full max-w-md mx-auto bg-card rounded-t-3xl p-6 pb-10 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {!confirmed ? (
              <>
                <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-4" />
                <div className="flex items-center gap-3">
                  <WorkerAvatar worker={w} size="md" />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-xl truncate">{w.name}</h2>
                    <p className="text-xs text-muted-foreground">{w.trade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Hourly</p>
                    <p className="font-bold text-primary">₹{w.startingPrice}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-2 w-full bg-secondary rounded-2xl px-3 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Time Slot
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTime(t)}
                          className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                            time === t
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary border-transparent text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <MapPinned className="size-3.5" /> Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House no., street, area, city"
                      className="mt-2 w-full bg-secondary rounded-2xl px-3 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <FileText className="size-3.5" /> Describe your problem
                    </label>
                    <textarea
                      rows={3}
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      placeholder="e.g. AC not cooling properly"
                      className="mt-2 w-full bg-secondary rounded-2xl p-3 text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                {errMsg && <p className="mt-3 text-xs text-destructive">{errMsg}</p>}

                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="mt-6 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Confirm Booking · ₹{w.startingPrice}
                </button>
              </>
            ) : (
              <div className="py-2">
                <div className="size-16 mx-auto bg-success/15 text-success rounded-full flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h2 className="font-serif text-2xl mt-4 text-center">Booking Confirmed!</h2>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {w.name} will confirm shortly.
                </p>

                <div className="mt-6 bg-secondary rounded-2xl p-4 space-y-3">
                  <DetailRow label="Booking ID" value={savedBooking?.id ? `#${savedBooking.id.slice(0, 8).toUpperCase()}` : "—"} />
                  <DetailRow label="Service" value={savedBooking?.service ?? ""} />
                  <DetailRow label="Worker" value={w.name} />
                  <DetailRow label="Date" value={savedBooking?.date ?? ""} />
                  <DetailRow label="Time" value={savedBooking?.time ?? ""} />
                  <DetailRow label="Address" value={savedBooking?.address ?? ""} />
                  <DetailRow label="Issue" value={savedBooking?.problem ?? ""} />
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="text-sm font-semibold">Amount</span>
                    <span className="text-sm font-bold text-primary">₹{savedBooking?.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Status</span>
                    <span className="text-xs font-bold uppercase text-accent bg-accent/10 px-2 py-1 rounded-full">Pending</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate({ to: "/user/bookings" })}
                  className="mt-6 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold"
                >
                  View My Bookings
                </button>
                <button
                  onClick={() => { setBookingOpen(false); setConfirmed(false); setSavedBooking(null); setProblem(""); setDate(""); setTime(""); }}
                  className="mt-2 w-full bg-secondary text-foreground py-3 rounded-2xl font-semibold text-sm"
                >
                  Close
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-semibold text-right break-words">{value}</span>
    </div>
  );
}
