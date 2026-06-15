import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Phone, User, MapPin, Briefcase, Clock, IndianRupee, FileText, Camera, Loader2 } from "lucide-react";
import { categories } from "@/lib/mock-data";
import { saveMemberProfile } from "@/lib/profile-store";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword, DEMO_OTP } from "@/lib/password";
import { saveSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { PasswordPair } from "./auth.login";

export const Route = createFileRoute("/auth/member")({
  component: MemberAuth,
});

type Step = "mobile" | "otp" | "password" | "details" | "pending";

function MemberAuth() {
  const navigate = useNavigate();
  const { lang, t, tService, tStatus } = useI18n();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [cat, setCat] = useState(categories[0].slug);
  const [fullName, setFullName] = useState("");
  const [area, setArea] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");
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
    if (existing) return setErr(t("signup.alreadyRegistered"));
    setStep("otp");
  }

  function handleVerifyOtp() {
    setErr(null);
    if (otp.join("") !== DEMO_OTP) return setErr(t("login.incorrectOtp"));
    setStep("password");
  }

  function handlePasswordNext() {
    setErr(null);
    if (pw.length < 6) return setErr(t("login.pwMin"));
    if (pw !== pw2) return setErr(t("login.pwMismatch"));
    setStep("details");
  }

  async function handleSubmit() {
    setErr(null);
    if (!fullName.trim() || !area.trim()) return setErr(t("signup.member.nameLocReq"));
    const yrs = experience ? parseInt(experience, 10) : 0;
    if (experience && (isNaN(yrs) || yrs < 0 || yrs > 50)) return setErr(t("signup.member.yearsMax"));
    setLoading(true);
    const hash = await hashPassword(pw);
    const workerId = await saveMemberProfile(
      {
        name: fullName.trim(),
        mobile: `+91 ${mobile}`,
        category: cat,
        area: area.trim(),
        experience,
        hourlyRate,
        bio,
      },
      hash,
    );
    setLoading(false);
    if (workerId) {
      saveSession({
        role: "worker",
        userId: workerId,
        name: fullName.trim(),
        mobile: `+91 ${mobile}`,
      });
    }
    setStep("pending");
  }

  return (
    <div className="mobile-shell px-5 py-6">
      <button
        type="button"
        onClick={() => {
          setErr(null);
          if (step === "mobile" || step === "pending") history.back();
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
            <div className="size-10 rounded-2xl bg-success text-success-foreground flex items-center justify-center font-bold font-serif text-lg">L</div>
            <span className="font-serif text-xl font-bold">LocalConnect</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
            <Briefcase className="size-3" /> {t("signup.member.forWorkers")}
          </div>
          <h1 className="font-serif text-3xl font-bold">{t("signup.member.grow")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("signup.member.growSub")}</p>

          <div className="mt-8">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("login.mobileLabel")}
            </label>
            <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-4">
              <span className="font-semibold text-sm">🇮🇳 +91</span>
              <input
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
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold disabled:opacity-40 flex items-center justify-center gap-2"
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
                id={`motp-${i}`}
                value={d}
                autoFocus={i === 0}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                  const next = [...otp];
                  next[i] = v;
                  setOtp(next);
                  if (v && i < 3) {
                    const el = document.getElementById(`motp-${i + 1}`) as HTMLInputElement | null;
                    el?.focus();
                  }
                }}
                maxLength={1}
                inputMode="numeric"
                className="w-14 h-16 text-center text-3xl font-bold bg-secondary rounded-2xl outline-none focus:ring-2 focus:ring-success"
              />
            ))}
          </div>
          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}
          <button
            type="submit"
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold"
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
            password={pw}
            confirm={pw2}
            setPassword={setPw}
            setConfirm={setPw2}
            show={showPw}
            setShow={setShowPw}
          />
          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}
          <button
            type="submit"
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold"
          >
            {t("common.continue")}
          </button>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <h1 className="font-serif text-3xl font-bold">{t("signup.member.profile")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("signup.member.profileSub")}</p>

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
              <div className="mt-2 flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3.5 opacity-70">
                <Phone className="size-4 text-muted-foreground" />
                <input
                  readOnly
                  value={`+91 ${mobile}`}
                  className="flex-1 bg-transparent outline-none text-sm font-medium text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("signup.member.category")}
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="mt-2 w-full bg-secondary rounded-2xl px-4 py-4 text-sm font-medium outline-none appearance-none"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.emoji} {tService(c.slug, c.name)}
                  </option>
                ))}
              </select>
            </div>

            <Field
              icon={<MapPin className="size-4" />}
              label={t("signup.member.serviceArea")}
              placeholder={t("signup.locationPlaceholder")}
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <Field
              icon={<Clock className="size-4" />}
              label={t("signup.member.years")}
              placeholder={t("signup.member.yearsPh")}
              inputMode="numeric"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("signup.member.hourly")}
              </label>
              <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3.5">
                <IndianRupee className="size-4 text-muted-foreground" />
                <input
                  inputMode="numeric"
                  placeholder="299"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("signup.member.bio")}
              </label>
              <div className="mt-2 flex items-start gap-2 bg-secondary rounded-2xl px-4 py-3.5">
                <FileText className="size-4 text-muted-foreground pt-0.5" />
                <textarea
                  rows={4}
                  placeholder={t("signup.member.bioPh")}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm font-medium resize-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("signup.member.photo")}
              </label>
              <label className="mt-2 cursor-pointer flex items-center gap-3 bg-secondary rounded-2xl px-4 py-4 border-2 border-dashed border-border hover:border-success/40 transition-colors">
                <span className="size-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                  <Camera className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t("signup.member.upload")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("signup.member.uploadSub")}</p>
                </div>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>

          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}

          <button
            type="submit"
            disabled={loading || !fullName.trim() || !area.trim()}
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t("signup.member.submit")}
          </button>
        </form>
      )}

      {step === "pending" && (
        <div className="pt-10 text-center">
          <div className="size-24 mx-auto rounded-full bg-warning/15 text-warning flex items-center justify-center text-4xl">
            ⏳
          </div>
          <h2 className="font-serif text-2xl font-bold mt-6">{t("signup.member.pendingTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-[28ch] mx-auto">
            {t("signup.member.pendingSub")}
          </p>

          <div className="mt-8 bg-secondary rounded-2xl p-4 text-left space-y-3">
            <Row label={t("signup.member.statusLabel")} value={tStatus("pending")} pill="warning" />
            <Row label={t("signup.member.submitted")} value={t("signup.member.justNow")} />
            <Row label={t("signup.member.categoryLabel")} value={tService(cat)} />
          </div>

          <button
            onClick={() => navigate({ to: "/member" })}
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold"
          >
            {t("signup.member.preview")}
          </button>
          <Link to="/" className="block mt-3 text-xs text-muted-foreground">
            {t("signup.member.backHome")}
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
