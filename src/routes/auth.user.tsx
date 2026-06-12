import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Phone, User, MapPin } from "lucide-react";

export const Route = createFileRoute("/auth/user")({
  component: UserAuth,
});

function UserAuth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"mobile" | "otp" | "details">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);

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
          <h1 className="font-serif text-3xl font-bold">Login as User</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send an OTP to verify.</p>

          <div className="mt-8">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mobile Number
            </label>
            <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-4">
              <span className="font-semibold text-sm">🇮🇳 +91</span>
              <input
                type="tel"
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
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold disabled:opacity-40 active:scale-[0.99] transition"
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
            {otp.map((d, i) => (
              <input
                key={i}
                value={d}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                  const next = [...otp];
                  next[i] = v;
                  setOtp(next);
                }}
                maxLength={1}
                inputMode="numeric"
                className="w-14 h-16 text-center text-3xl font-bold bg-secondary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>

          <button
            onClick={() => setStep("details")}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.99]"
          >
            Verify & Continue
          </button>
        </>
      )}

      {step === "details" && (
        <>
          <h1 className="font-serif text-3xl font-bold">Almost there</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us a bit about you.</p>

          <div className="mt-6 space-y-4">
            <Field icon={<User className="size-4" />} label="Full Name" placeholder="Rahul Sharma" />
            <Field
              icon={<Phone className="size-4" />}
              label="Mobile"
              value={`+91 ${mobile}`}
              disabled
            />
            <Field icon={<MapPin className="size-4" />} label="Location" placeholder="City, area" />
          </div>

          <button
            onClick={() => navigate({ to: "/user" })}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.99]"
          >
            Continue to Dashboard
          </button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Want to provide services?{" "}
            <Link to="/auth/member" className="text-primary font-bold">
              Become a member
            </Link>
          </p>
        </>
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
