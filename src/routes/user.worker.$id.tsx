import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { categoryBySlug } from "@/lib/mock-data";
import { WorkerAvatar, AvailabilityBadge, CategoryBadges } from "@/components/worker-card";
import { useWorkerById } from "@/lib/workers-api";
import { ArrowLeft, Star, MapPin, Calendar, Clock, MapPinned, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/lib/profile-store";
import { SaveWorkerButton } from "@/components/save-worker-button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/user/worker/$id")({
  component: WorkerProfile,
});

function WorkerProfile() {
  const { t, tService, tStatus } = useI18n();
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
    if (!date) {
      setErrMsg(t("worker.selectDate"));
      return;
    }
    if (!time) {
      setErrMsg(t("worker.selectTime"));
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
        {t("worker.notFound")} <Link to="/user" className="text-primary">{t("worker.home")}</Link>
      </div>
    );
  }

  const tradeLabel = tService(w.category, w.trade);

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <header className="bg-card px-5 pt-6 pb-4 sticky top-0 z-30 border-b border-border flex items-center justify-between">
          <Link to="/user" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" /> {t("common.back")}
          </Link>
          <SaveWorkerButton workerId={w.id} />
        </header>

        <main className="flex-1 px-5 py-6 pb-32 space-y-6">
          <section className="flex items-start gap-4">
            <WorkerAvatar worker={w} size="lg" />
            <div className="flex-1">
              <h1 className="font-serif text-2xl">{w.name}</h1>
              <p className="text-sm text-muted-foreground">{tradeLabel}</p>
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
          </section>

          {w.categories?.length > 0 && (
            <section>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {t("worker.services")}
              </h3>
              <CategoryBadges slugs={w.categories} />
            </section>
          )}

          <section className="grid grid-cols-2 gap-3">
            <Stat label={t("worker.experience")} value={`${w.experience} ${t("worker.yrs")}`} />
            <Stat label={t("worker.rating")} value={w.rating.toFixed(1)} />
          </section>

          {w.bio && (
            <section className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-sm font-sans mb-2">{t("worker.about")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{w.bio}</p>
            </section>
          )}

          <section className="bg-card border border-border rounded-2xl p-4">
            <h3 className="font-bold text-sm font-sans mb-1">{t("worker.serviceArea")}</h3>
            <p className="text-sm text-muted-foreground">{w.area || "—"}{cat ? ` • ${tService(cat.slug, cat.name)}` : ""}</p>
          </section>
        </main>

        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-5 py-3 z-40">
          <button
            onClick={() => setBookingOpen(true)}
            className="w-full bg-primary text-primary-foreground rounded-2xl font-bold text-sm py-3.5"
          >
            {t("worker.bookNow")}
          </button>
        </div>
      </div>

      {bookingOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="w-full max-w-md mx-auto bg-background flex flex-col h-full">
            {!confirmed ? (
              <>
                <header className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border shrink-0">
                  <button
                    onClick={() => setBookingOpen(false)}
                    aria-label={t("common.back")}
                    className="size-9 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-lg truncate leading-tight">{w.name}</h2>
                    <p className="text-xs text-muted-foreground truncate">{tradeLabel}</p>
                  </div>
                </header>

                <div className="flex-1 px-4 py-3 flex flex-col gap-3 min-h-0">
                  <div>
                    <label htmlFor="booking-date" className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> {t("worker.date")}
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => { setDate(e.target.value); setErrMsg(null); }}
                      className="mt-1.5 w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-foreground outline-none focus:border-primary"
                      style={{ colorScheme: "light" }}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {t("worker.timeSlot")}
                    </label>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setTime(s); setErrMsg(null); }}
                          className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                            time === s
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary border-transparent text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <MapPinned className="size-3.5" /> {t("worker.address")}
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); setErrMsg(null); }}
                      placeholder={t("worker.addressPh")}
                      className="mt-1.5 w-full bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none"
                    />
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col">
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <FileText className="size-3.5" /> {t("worker.describeProblem")} <span className="normal-case tracking-normal text-muted-foreground/70">({t("common.optional")})</span>
                    </label>
                    <textarea
                      value={problem}
                      onChange={(e) => { setProblem(e.target.value); setErrMsg(null); }}
                      placeholder={t("worker.problemPh")}
                      className="mt-1.5 w-full flex-1 min-h-[72px] bg-secondary rounded-xl p-3 text-sm outline-none resize-none"
                    />
                  </div>

                  {errMsg && <p className="text-xs text-destructive">{errMsg}</p>}
                </div>

                <div
                  className="px-4 pt-2 pb-3 border-t border-border shrink-0"
                  style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
                >
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {t("worker.confirmBooking")}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">

                <div className="size-16 mx-auto bg-success/15 text-success rounded-full flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h2 className="font-serif text-2xl mt-4 text-center">{t("worker.bookingConfirmed")}</h2>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {w.name} {t("worker.willConfirm")}
                </p>

                <div className="mt-6 bg-secondary rounded-2xl p-4 space-y-3">
                  <DetailRow label={t("worker.bookingId")} value={savedBooking?.id ? `#${savedBooking.id.slice(0, 8).toUpperCase()}` : "—"} />
                  <DetailRow label={t("worker.service")} value={savedBooking?.service ?? ""} />
                  <DetailRow label={t("worker.workerLbl")} value={w.name} />
                  <DetailRow label={t("worker.date")} value={savedBooking?.date ?? ""} />
                  <DetailRow label={t("worker.timeSlot")} value={savedBooking?.time ?? ""} />
                  <DetailRow label={t("worker.address")} value={savedBooking?.address ?? ""} />
                  <DetailRow label={t("worker.issue")} value={savedBooking?.problem ?? ""} />
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="text-sm font-semibold">{t("worker.amount")}</span>
                    <span className="text-sm font-bold text-primary">₹{savedBooking?.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">{t("worker.status")}</span>
                    <span className="text-xs font-bold uppercase text-accent bg-accent/10 px-2 py-1 rounded-full">{tStatus("pending")}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate({ to: "/user/bookings" })}
                  className="mt-6 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold"
                >
                  {t("worker.viewBookings")}
                </button>
                <button
                  onClick={() => { setBookingOpen(false); setConfirmed(false); setSavedBooking(null); setProblem(""); setDate(""); setTime(""); }}
                  className="mt-2 w-full bg-secondary text-foreground py-3 rounded-2xl font-semibold text-sm"
                >
                  {t("worker.close")}
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
