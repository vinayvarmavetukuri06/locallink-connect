import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setUserProfile, setMemberProfile } from "@/lib/profile-store";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function verifyAndRoute() {
    setErr(null);
    setLoading(true);
    const fullMobile = `+91 ${mobile}`;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, mobile, location, role")
      .eq("mobile", fullMobile)
      .maybeSingle();
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (!profile) {
      setErr("No account found with this number. Please sign up first.");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("lc:user-id", profile.id);
    }

    if (profile.role === "worker") {
      setMemberProfile({
        name: profile.full_name ?? "",
        mobile: profile.mobile ?? fullMobile,
        category: "ac-repair",
        area: profile.location ?? "",
        experience: "",
        hourlyRate: "",
        bio: "",
      });
      navigate({ to: "/member" });
    } else {
      setUserProfile({
        name: profile.full_name ?? "",
        mobile: profile.mobile ?? fullMobile,
        location: profile.location ?? "",
      });
      navigate({ to: "/user" });
    }
  }

  return (
    <div className="mobile-shell px-5 py-6">
      <button
        onClick={() => (step === "mobile" ? history.back() : setStep("mobile"))}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      {step === "mobile" ? (
        <>
          <h1 className="font-serif text-3xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Login with your registered mobile.</p>

          <div className="mt-8">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mobile Number
            </label>
            <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-4">
              <span className="font-semibold text-sm">🇮🇳 +91</span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                inputMode="numeric"
                placeholder="98765 43210"
                className="flex-1 bg-transparent outline-none text-base font-medium"
              />
            </div>
          </div>

          <button
            onClick={() => mobile.length === 10 && setStep("otp")}
            disabled={mobile.length < 10}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold disabled:opacity-40 active:scale-[0.99] transition"
          >
            Send OTP
          </button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            New to LocalConnect?{" "}
            <Link to="/auth" className="text-primary font-bold">Create an account</Link>
          </p>
        </>
      ) : (
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

          {err && <p className="mt-4 text-xs text-destructive text-center">{err}</p>}

          <button
            onClick={verifyAndRoute}
            disabled={loading}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Verify & Continue
          </button>
        </>
      )}
    </div>
  );
}
