import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Phone, User, Loader2 } from "lucide-react";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { saveUserProfile } from "@/lib/profile-store";
import { hashPassword, DEMO_OTP } from "@/lib/password";
import { supabase } from "@/integrations/supabase/client";
import { saveSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { PasswordPair } from "./auth.login";

export const Route = createFileRoute("/auth/user")({
  component: UserAuth,
});

type Step = "mobile" | "otp" | "password" | "details";

function UserAuth() {
  const navigate = useNavigate();
  const { lang, t } = useI18n();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleMobileNext() {
    setErr(null);
    if (mobile.length !== 10) return setErr(t("login.invalidMobile"));
    setLoading(true);
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("mobile", `+91 ${mobile}`)
      .maybeSingle();
    setLoading(false);
    if (existing) {
      setErr(t("signup.alreadyRegistered"));
      return;
    }
    setStep("otp");
  }

  function handleVerifyOtp() {
    setErr(null);
    if (otp.join("") !== DEMO_OTP) return setErr(t("login.incorrectOtp"));
    setStep("password");
  }

  function handlePasswordNext() {
    setErr(null);
    if (password.length < 6) return setErr(t("login.pwMin"));
    if (password !== confirm) return setErr(t("login.pwMismatch"));
    setStep("details");
  }

  async function handleFinish() {
    setErr(null);
    if (!fullName.trim()) return setErr(t("signup.enterName"));
    setLoading(true);
    const hash = await hashPassword(password);
    const userId = await saveUserProfile(
      {
        name: fullName.trim(),
        mobile: `+91 ${mobile}`,
        location: location.trim() || "—",
      },
      hash,
    );
    setLoading(false);
    if (userId) {
      saveSession({
        role: "customer",
        userId,
        name: fullName.trim(),
        mobile: `+91 ${mobile}`,
      });
    }
    navigate({ to: "/user" });
  }

  return (
    <div className="mobile-shell px-5 py-6">
      <button
        type="button"
        onClick={() => {
          setErr(null);
          if (step === "mobile") history.back();
          else if (step === "otp") setStep("mobile");
          else if (step === "password") setStep("otp");
          else setStep("password");
        }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"
      >
        <ArrowLeft className="size-4" /> {t("common.back")}
      </button>

      {step === "mobile" && (
        <form onSubmit={(e) => { e.preventDefault(); handleMobileNext(); }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="size-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-serif text-lg">L</div>
            <span className="font-serif text-xl font-bold">LocalConnect</span>
          </div>
          <h1 className="font-serif text-3xl font-bold">{t("signup.user.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("signup.user.subtitle")}</p>

          <div className="mt-8">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("login.mobileLabel")}
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

          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t("signup.sendOtp")}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}>
          <h1 className="font-serif text-3xl font-bold">{t("signup.enterOtp")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("signup.sentTo")} +91 {mobile}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{t("signup.demoOtp")} {DEMO_OTP}</p>

          <div className="mt-8 flex gap-3 justify-center">
            {otp.map((d, i) => (
              <input
                key={i}
                id={`uotp-${i}`}
                value={d}
                autoFocus={i === 0}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                  const next = [...otp];
                  next[i] = v;
                  setOtp(next);
                  if (v && i < 3) {
                    const el = document.getElementById(`uotp-${i + 1}`) as HTMLInputElement | null;
                    el?.focus();
                  }
                }}
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
            {t("signup.verifyContinue")}
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={(e) => { e.preventDefault(); handlePasswordNext(); }}>
          <h1 className="font-serif text-3xl font-bold">{t("signup.createPassword")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("signup.createPwSub")}</p>

          <PasswordPair
            password={password}
            confirm={confirm}
            setPassword={setPassword}
            setConfirm={setConfirm}
            show={showPw}
            setShow={setShowPw}
          />

          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}

          <button
            type="submit"
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.99]"
          >
            {t("common.continue")}
          </button>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={(e) => { e.preventDefault(); handleFinish(); }}>
          <h1 className="font-serif text-3xl font-bold">{t("signup.almostThere")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("signup.tellAbout")}</p>

          <div className="mt-6 space-y-4">
            <Field
              icon={<User className="size-4" />}
              label={t("signup.fullName")}
              placeholder={lang === "hi" ? "आपका नाम" : lang === "te" ? "మీ పేరు" : "Your name"}
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              lang={lang}
              inputMode="text"
              autoComplete="name"
              hint={lang === "hi" ? t("auth.nameHintHi") : lang === "te" ? t("auth.nameHintTe") : undefined}
            />

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("signup.mobile")}
              </label>
              <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3.5">
                <Phone className="size-4" />
                <input
                  readOnly
                  value={`+91 ${mobile}`}
                  className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground"
                />
              </div>
            </div>

            <CityAutocomplete
              label={t("signup.location")}
              placeholder={t("signup.locationPlaceholder")}
              value={location}
              onChange={setLocation}
            />
          </div>

          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}

          <button
            type="submit"
            disabled={loading || !fullName.trim()}
            className="mt-8 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t("signup.continueDashboard")}
          </button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t("signup.wantProvide")}{" "}
            <Link to="/auth/member" className="text-primary font-bold">
              {t("signup.becomeMember")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

function Field({
  icon,
  label,
  hint,
  ...inputProps
}: { icon: React.ReactNode; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
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
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
