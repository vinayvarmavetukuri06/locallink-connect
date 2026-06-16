import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Phone, User, Clock, FileText, Camera, Loader2, Briefcase, X, ChevronDown, Check } from "lucide-react";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { categories } from "@/lib/mock-data";
import { saveMemberProfile } from "@/lib/profile-store";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword, DEMO_OTP } from "@/lib/password";
import { saveSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { uploadAvatar } from "@/lib/avatar";
import { PasswordPair } from "./auth.login";

export const Route = createFileRoute("/auth/member")({
  component: MemberAuth,
});

type Step = "mobile" | "otp" | "password" | "details" | "pending";

type Errors = Partial<Record<"name" | "categories" | "area" | "experience" | "bio", string>>;

function MemberAuth() {
  const navigate = useNavigate();
  const { lang, t, tService, tStatus } = useI18n();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [cats, setCats] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [area, setArea] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [askPhoto, setAskPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // validation
  const [touched, setTouched] = useState(false);

  const errors: Errors = useMemo(() => {
    const e: Errors = {};
    if (fullName.trim().length < 3) e.name = t("signup.member.err.name");
    if (cats.length < 1) e.categories = t("signup.member.err.categories");
    if (area.trim().length < 3) e.area = t("signup.member.err.area");
    const yrs = experience ? parseInt(experience, 10) : 0;
    if (!experience || isNaN(yrs) || yrs < 1 || yrs > 50) e.experience = t("signup.member.err.experience");
    if (bio.trim().length < 20) e.bio = t("signup.member.err.bio");
    return e;
  }, [fullName, cats, area, experience, bio, t]);

  const isValid = Object.keys(errors).length === 0;
  const requiredCount = 6;
  const completedCount = [
    fullName.trim().length >= 3,
    cats.length >= 1,
    !!mobile,
    area.trim().length >= 3,
    experience && parseInt(experience, 10) >= 1 && parseInt(experience, 10) <= 50,
    bio.trim().length >= 20,
  ].filter(Boolean).length;

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

  function toggleCat(slug: string) {
    setCats((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]));
  }

  function handlePhotoAllow() {
    setAskPhoto(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  }

  function handlePhotoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(typeof ev.target?.result === "string" ? ev.target.result : null);
    reader.readAsDataURL(f);
  }

  async function handleSubmit() {
    setErr(null);
    setTouched(true);
    if (!isValid) return;
    setLoading(true);
    const hash = await hashPassword(pw);
    let avatarPath: string | null = null;
    if (photoFile) {
      avatarPath = await uploadAvatar(photoFile, `+91${mobile}`);
    }
    const workerId = await saveMemberProfile(
      {
        name: fullName.trim(),
        mobile: `+91 ${mobile}`,
        categories: cats,
        area: area.trim(),
        experience,
        bio: bio.trim(),
        avatarPath,
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

  const initials = (fullName.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")) || "?";

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
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>
          <h1 className="font-serif text-3xl font-bold">{t("signup.member.profile")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("signup.member.profileSub")}</p>

          {/* Progress */}
          <div className="mt-4 bg-secondary rounded-2xl p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-muted-foreground uppercase tracking-wider">{t("signup.member.progress")}</span>
              <span className="text-foreground">{completedCount}/{requiredCount} {t("signup.member.completed")}</span>
            </div>
            <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-success transition-all"
                style={{ width: `${(completedCount / requiredCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Photo */}
          <div className="mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => (photoPreview ? setPhotoPreview(null) : setAskPhoto(true))}
              className="relative size-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden"
              aria-label={t("signup.member.upload")}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <Camera className="size-7" />
                </div>
              )}
              <span className="absolute -bottom-0 -right-0 bg-success text-success-foreground rounded-full p-1.5 border-2 border-background">
                {photoPreview ? <X className="size-3" /> : <Camera className="size-3" />}
              </span>
            </button>
            <p className="mt-2 text-xs text-muted-foreground">{photoPreview ? t("signup.member.photoTapRemove") : t("signup.member.photoTapAdd")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChosen}
            />
          </div>

          <div className="mt-6 space-y-5">
            {/* Name */}
            <div>
              <FieldLabel>{t("signup.fullName")} <Req /></FieldLabel>
              <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3.5">
                <User className="size-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === "hi" ? "आपका नाम" : lang === "te" ? "మీ పేరు" : "Your name"}
                  className="flex-1 bg-transparent outline-none text-sm font-medium"
                />
                {fullName && (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{initials}</span>
                )}
              </div>
              {touched && errors.name && <ErrorText>{errors.name}</ErrorText>}
            </div>

            {/* Mobile */}
            <div>
              <FieldLabel>{t("signup.mobile")} <Req /></FieldLabel>
              <div className="mt-2 flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3.5 opacity-70">
                <Phone className="size-4 text-muted-foreground" />
                <input
                  readOnly
                  value={`+91 ${mobile}`}
                  className="flex-1 bg-transparent outline-none text-sm font-medium text-muted-foreground"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <FieldLabel>{t("signup.member.categories")} <Req /></FieldLabel>
              <p className="text-[11px] text-muted-foreground mt-1">{t("signup.member.categoriesHint")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((c) => {
                  const active = cats.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => toggleCat(c.slug)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-foreground border-transparent"
                      }`}
                    >
                      <span>{c.emoji}</span>
                      <span>{tService(c.slug, c.name)}</span>
                    </button>
                  );
                })}
              </div>
              {touched && errors.categories && <ErrorText>{errors.categories}</ErrorText>}
            </div>

            {/* Area */}
            <div>
              <FieldLabel>{t("signup.member.serviceArea")} <Req /></FieldLabel>
              <CityAutocomplete
                placeholder={t("signup.locationPlaceholder")}
                value={area}
                onChange={setArea}
              />
              {touched && errors.area && <ErrorText>{errors.area}</ErrorText>}
            </div>

            {/* Experience */}
            <div>
              <FieldLabel>{t("signup.member.years")} <Req /></FieldLabel>
              <div className="mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3.5">
                <Clock className="size-4 text-muted-foreground" />
                <input
                  inputMode="numeric"
                  placeholder={t("signup.member.yearsPh")}
                  value={experience}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                    const n = v ? parseInt(v, 10) : 0;
                    if (n > 50) setExperience("50");
                    else setExperience(v);
                  }}
                  className="flex-1 bg-transparent outline-none text-sm font-medium"
                />
              </div>
              {touched && errors.experience && <ErrorText>{errors.experience}</ErrorText>}
            </div>

            {/* Bio */}
            <div>
              <FieldLabel>{t("signup.member.bio")} <Req /></FieldLabel>
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
              <div className="mt-1 flex items-center justify-between">
                {touched && errors.bio ? <ErrorText>{errors.bio}</ErrorText> : <span />}
                <span className="text-[11px] text-muted-foreground">{bio.trim().length}/20</span>
              </div>
            </div>
          </div>

          {err && <p className="mt-4 text-xs text-destructive text-center font-semibold">{err}</p>}

          <button
            type="submit"
            disabled={loading || !isValid}
            onClick={() => setTouched(true)}
            className="mt-8 w-full bg-success text-success-foreground py-4 rounded-2xl font-bold disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {t("signup.member.submit")}
          </button>
        </form>
      )}

      {askPhoto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-5" onClick={() => setAskPhoto(false)}>
          <div
            className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="size-12 rounded-2xl bg-success/10 text-success flex items-center justify-center">
              <Camera className="size-6" />
            </div>
            <h3 className="mt-4 font-serif text-xl">{t("photoPerm.title")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("photoPerm.body")}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAskPhoto(false)}
                className="py-3 rounded-2xl bg-secondary text-foreground font-semibold text-sm"
              >
                {t("photoPerm.notNow")}
              </button>
              <button
                type="button"
                onClick={handlePhotoAllow}
                className="py-3 rounded-2xl bg-success text-success-foreground font-bold text-sm"
              >
                {t("photoPerm.allow")}
              </button>
            </div>
          </div>
        </div>
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
            <Row label={t("signup.member.categoryLabel")} value={cats.map((c) => tService(c)).join(", ")} />
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </label>
  );
}

function Req() {
  return <span className="text-destructive">*</span>;
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[11px] font-semibold text-destructive">{children}</p>;
}
