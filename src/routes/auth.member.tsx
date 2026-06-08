import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Phone, User, MapPin, Briefcase, Clock } from "lucide-react";
import { categories } from "@/lib/mock-data";

export const Route = createFileRoute("/auth/member")({
  component: MemberAuth,
});

function MemberAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"mobile" | "otp" | "details" | "pending">("mobile");
  const [mobile, setMobile] = useState("");
  const [cat, setCat] = useState(categories[0].slug);

  return (
    <div className="mobile-shell px-5 py-6">
      <button
        onClick={() => (step === "mobile" ? history.back() : setStep("mobile"))}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      {step === "mobile" && (
        <>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
            <Briefcase className="size-3" /> For Workers
          </div>
          <h1 className="font-serif text-3xl font-bold">Grow Your Business</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get bookings from customers near you.
          </p>

          <div className="mt-8">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mobile Number
            </label>
            <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-4">
              <span className="font-semibold text-sm">🇮🇳 +91</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={10}
                inputMode="numeric"
                placeholder="98765 43210"
                className="flex-1 bg-transparent outline-none text-base font-medium"
              />
            </div>
          </div>

          <button
            onClick={() => mobile.length >= 10 && setStep("otp")}
            disabled={mobile.length < 10}
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold disabled:opacity-40"
          >
            Send OTP
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <h1 className="font-serif text-3xl font-bold">Enter OTP</h1>
          <p className="text-sm text-muted-foreground mt-1">Sent to +91 {mobile}</p>
          <div className="mt-8 flex gap-3 justify-center">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                maxLength={1}
                inputMode="numeric"
                className="size-14 text-center text-2xl font-bold bg-secondary rounded-2xl outline-none focus:ring-2 focus:ring-success"
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">Demo OTP: 1234</p>
          <button
            onClick={() => setStep("details")}
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold"
          >
            Verify & Continue
          </button>
        </>
      )}

      {step === "details" && (
        <>
          <h1 className="font-serif text-3xl font-bold">Worker Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Help customers find you.</p>

          <div className="mt-6 space-y-4">
            <Field icon={<User className="size-4" />} label="Full Name" placeholder="Your name" />
            <Field icon={<Phone className="size-4" />} label="Mobile" value={`+91 ${mobile}`} disabled />

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Service Category
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="mt-2 w-full bg-secondary rounded-2xl px-4 py-4 text-sm font-medium outline-none appearance-none"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Field icon={<MapPin className="size-4" />} label="Location / Service Area" placeholder="City, area" />
            <Field icon={<Clock className="size-4" />} label="Years of Experience" placeholder="e.g. 5" inputMode="numeric" />
          </div>

          <button
            onClick={() => setStep("pending")}
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold"
          >
            Submit for Approval
          </button>
        </>
      )}

      {step === "pending" && (
        <div className="pt-10 text-center">
          <div className="size-24 mx-auto rounded-full bg-warning/15 text-warning flex items-center justify-center text-4xl">
            ⏳
          </div>
          <h2 className="font-serif text-2xl font-bold mt-6">Pending Admin Approval</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-[28ch] mx-auto">
            We're reviewing your application. You'll get a notification within 24 hours.
          </p>

          <div className="mt-8 bg-secondary rounded-2xl p-4 text-left space-y-3">
            <Row label="Status" value="Pending" pill="warning" />
            <Row label="Submitted" value="Just now" />
            <Row label="Category" value={categories.find((c) => c.slug === cat)?.name || ""} />
          </div>

          <button
            onClick={() => navigate({ to: "/member" })}
            className="mt-8 w-full bg-foreground text-background py-4 rounded-2xl font-bold"
          >
            Preview Member Dashboard
          </button>
          <Link to="/" className="block mt-3 text-xs text-muted-foreground">
            Back to home
          </Link>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  pill,
}: { label: string; value: string; pill?: "warning" | "success" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {pill ? (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            pill === "warning" ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
          }`}
        >
          {value}
        </span>
      ) : (
        <span className="text-sm font-bold">{value}</span>
      )}
    </div>
  );
}

function Field({
  icon,
  label,
  ...inputProps
}: { icon: React.ReactNode; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3.5">
        <span className="text-muted-foreground">{icon}</span>
        <input
          {...inputProps}
          className="flex-1 bg-transparent outline-none text-sm font-medium disabled:opacity-60"
        />
      </div>
    </div>
  );
}
