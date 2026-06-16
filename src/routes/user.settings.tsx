import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword, verifyPassword } from "@/lib/password";
import { useI18n } from "@/lib/i18n";
import { CityAutocomplete } from "@/components/city-autocomplete";

export const Route = createFileRoute("/user/settings")({
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const customerId =
    typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!customerId) { setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", customerId)
        .maybeSingle();
      if (data) {
        setName(data.full_name ?? "");
        setLocation(data.location ?? "");
      }
      setLoading(false);
    })();
  }, [customerId]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setSaving(true); setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, location })
      .eq("id", customerId);
    setSaving(false);
    setMsg(error ? t("settings.couldNotSave") : t("settings.profileUpdated"));
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setPwSaving(true); setPwMsg(null);
    const { data: prof } = await supabase
      .from("profiles")
      .select("password_hash")
      .eq("id", customerId)
      .maybeSingle();
    const stored = (prof as any)?.password_hash;
    const ok = stored ? await verifyPassword(currentPw, stored) : false;
    if (!ok) {
      setPwMsg(t("settings.currentPwIncorrect"));
      setPwSaving(false);
      return;
    }
    const newHash = await hashPassword(newPw);
    const { error } = await supabase
      .from("profiles")
      .update({ password_hash: newHash })
      .eq("id", customerId);
    setPwSaving(false);
    if (error) setPwMsg(t("settings.couldNotUpdatePw"));
    else { setPwMsg(t("settings.pwUpdated")); setCurrentPw(""); setNewPw(""); }
  }

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <Link to="/user/profile"><ArrowLeft className="size-5" /></Link>
        <h1 className="font-serif text-2xl">{t("settings.title")}</h1>
      </header>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <form onSubmit={saveProfile} className="px-5 py-5 space-y-3">
            <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">{t("settings.profile")}</h2>
            <div>
              <label className="text-xs font-semibold">{t("settings.name")}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 bg-secondary rounded-2xl px-4 py-3 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold">{t("settings.location")}</label>
              <CityAutocomplete value={location} onChange={setLocation} />
            </div>
            <button disabled={saving} type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold text-sm">
              {saving ? t("common.saving") : t("settings.saveChanges")}
            </button>
            {msg && <p className="text-xs text-center text-muted-foreground">{msg}</p>}
          </form>

          <form onSubmit={changePassword} className="px-5 pb-8 space-y-3">
            <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">{t("settings.changePassword")}</h2>
            <input type="password" placeholder={t("settings.currentPw")} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none" required />
            <input type="password" placeholder={t("settings.newPw")} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none" required minLength={6} />
            <button disabled={pwSaving} type="submit" className="w-full bg-foreground text-background py-3 rounded-2xl font-bold text-sm">
              {pwSaving ? t("common.updating") : t("settings.updatePw")}
            </button>
            {pwMsg && <p className="text-xs text-center text-muted-foreground">{pwMsg}</p>}
          </form>
        </>
      )}
      <span className="hidden">{String(!!navigate)}</span>
    </>
  );
}
