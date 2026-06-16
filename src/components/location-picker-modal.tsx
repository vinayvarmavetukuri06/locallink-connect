import { useEffect, useState } from "react";
import { X, MapPin, Search, Loader2 } from "lucide-react";
import { searchCities } from "@/lib/indian-cities";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { saveUserProfile, useUserProfile } from "@/lib/profile-store";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string | null;
};

export function LocationPickerModal({ open, onClose, userId }: Props) {
  const { t } = useI18n();
  const user = useUserProfile();
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  if (!open) return null;
  const results = searchCities(query, 20);

  async function choose(city: string) {
    setSaving(city);
    try {
      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ location: city })
          .eq("id", userId);
        if (error) throw error;
      }
      // Persist locally too via saveUserProfile (upserts by mobile)
      await saveUserProfile({ ...user, location: city });
      toast.success(t("city.updated"));
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(t("city.updateFailed"));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-backdrop-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div>
            <h2 className="font-serif text-xl font-bold">{t("city.modalTitle")}</h2>
            <p className="text-xs text-muted-foreground">{t("city.modalSub")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full flex items-center justify-center hover:bg-secondary"
            aria-label={t("common.close")}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-5 py-3">
          <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("city.searchPh")}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-4">
          {results.length === 0 ? (
            <li className="px-5 py-6 text-center text-sm text-muted-foreground">
              {t("city.noResults")}
            </li>
          ) : (
            results.map((city) => (
              <li key={city}>
                <button
                  type="button"
                  disabled={saving !== null}
                  onClick={() => choose(city)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl hover:bg-secondary text-left disabled:opacity-60"
                >
                  <span className="flex items-center gap-3">
                    <MapPin className="size-4 text-primary" />
                    <span className="text-sm font-medium">{city}</span>
                  </span>
                  {saving === city && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
