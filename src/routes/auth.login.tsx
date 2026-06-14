import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setUserProfile, setMemberProfile } from "@/lib/profile-store";
import { hashPassword, DEMO_OTP } from "@/lib/password";
import { saveSession } from "@/lib/session";
import { LanguageButton } from "@/components/language-selector";

export const Route = createFileRoute("/auth/login")({
  component: Login,
});

type Step = "mobile" | "forgot-otp" | "forgot-reset";

function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleLogin() {
    setErr(null);
    if (mobile.length !== 10) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 6) {
      setErr("Enter your password.");
      return;
    }
    setLoading(true);
    const fullMobile = `+91 ${mobile}`;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, mobile, location, role, password_hash")
      .eq("mobile", fullMobile)
      .maybeSingle();

    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }
    if (!profile) {
      setLoading(false);
      setErr("Phone number not registered");
      return;
    }
    const hash = await hashPassword(password);
    if (!profile.password_hash || profile.password_hash !== hash) {
      setLoading(false);
      setErr("Incorrect password");
      return;
    }
    setLoading(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("lc:user-id", profile.id);
    }

    saveSession({
      role: profile.role === "worker" ? "worker" : "customer",
      userId: profile.id,
      name: profile.full_name ?? "",
      mobile: profile.mobile ?? fullMobile,
    });

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

  async function handleForgotStart() {
    setErr(null);
    setInfo(null);
    if (mobile.length !== 10) {
      setErr("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    const fullMobile = `+91 ${mobile}`;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("mobile", fullMobile)
      .maybeSingle();
    setLoading(false);
    if (error) return setErr(error.message);
    if (!profile) return setErr("Phone number not registered");
    setOtp(["", "", "", ""]);
    setInfo(`Demo OTP is ${DEMO_OTP}`);
    setStep("forgot-otp");
  }

  function handleVerifyForgotOtp() {
    setErr(null);
    if (otp.join("") !== DEMO_OTP) {
      setErr("Incorrect OTP. Use 1234 for demo.");
      return;
    }
    setStep("forgot-reset");
  }

  async function handleResetPassword() {
    setErr(null);
    if (newPw.length < 6) return setErr("Password must be at least 6 characters.");
    if (newPw !== newPw2) return setErr("Passwords do not match.");
    setLoading(true);
    const fullMobile = `+91 ${mobile}`;
    const password_hash = await hashPassword(newPw);
    const { error } = await supabase
      .from("profiles")
      .update({ password_hash })
      .eq("mobile", fullMobile);
    setLoading(false);
    if (error) return setErr(error.message);
    setStep("mobile");
    setPassword("");
    setInfo("Password updated. Please log in.");
  }

  return (
    <div className="mobile-shell px-5 py-6">
      <button
        type="button"
        onClick={() => {
          setErr(null);
          setInfo(null);
          if (step === "mobile") history.back();
          else if (step === "forgot-otp") setStep("mobile");
          else setStep("forgot-otp");
        }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      {step === "mobile" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <h1 className="font-serif text-3xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Login with your mobile and password.</p>

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
                autoFocus
                className="flex-1 bg-transparent outline-none text-base font-medium"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-4">
              <Lock className="size-4 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="flex-1 bg-transparent outline-none text-base font-medium"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="text-muted-foreground">
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={handleForgotStart}
                className="text-xs font-bold text-primary"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}
          {info && !err && <p className="mt-4 text-xs text-success text-center font-semibold">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Login
          </button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            New to LocalConnect?{" "}
            <Link to="/auth" className="text-primary font-bold">Create an account</Link>
          </p>
        </form>
      )}

      {step === "forgot-otp" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyForgotOtp();
          }}
        >
          <h1 className="font-serif text-3xl font-bold">Reset password</h1>
          <p className="text-sm text-muted-foreground mt-1">OTP sent to +91 {mobile}</p>
          {info && <p className="mt-1 text-[11px] text-muted-foreground">{info}</p>}

          <div className="mt-8 flex gap-3 justify-center">
            {otp.map((d, i) => (
              <input
                key={i}
                value={d}
                autoFocus={i === 0}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                  const next = [...otp];
                  next[i] = v;
                  setOtp(next);
                  if (v && i < 3) {
                    const el = document.getElementById(`fpotp-${i + 1}`) as HTMLInputElement | null;
                    el?.focus();
                  }
                }}
                id={`fpotp-${i}`}
                maxLength={1}
                inputMode="numeric"
                className="w-14 h-16 text-center text-3xl font-bold bg-secondary rounded-2xl outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>

          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}

          <button
            type="submit"
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.99]"
          >
            Verify OTP
          </button>
        </form>
      )}

      {step === "forgot-reset" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleResetPassword();
          }}
        >
          <h1 className="font-serif text-3xl font-bold">New password</h1>
          <p className="text-sm text-muted-foreground mt-1">Set a new password for your account.</p>

          <PasswordPair
            password={newPw}
            confirm={newPw2}
            setPassword={setNewPw}
            setConfirm={setNewPw2}
            show={showNewPw}
            setShow={setShowNewPw}
          />

          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Update password
          </button>
        </form>
      )}
    </div>
  );
}

export function PasswordPair({
  password,
  confirm,
  setPassword,
  setConfirm,
  show,
  setShow,
}: {
  password: string;
  confirm: string;
  setPassword: (v: string) => void;
  setConfirm: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Password
        </label>
        <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-4">
          <Lock className="size-4 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoFocus
            className="flex-1 bg-transparent outline-none text-base font-medium"
          />
          <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Confirm Password
        </label>
        <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-4">
          <Lock className="size-4 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className="flex-1 bg-transparent outline-none text-base font-medium"
          />
        </div>
      </div>
    </div>
  );
}
