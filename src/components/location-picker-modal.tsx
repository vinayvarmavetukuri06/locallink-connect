import { useEffect, useRef, useState } from "react";
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

type NominatimResult = {
  place_id: number;
  display_name: string;
  name?: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    suburb?: string;
    neighbourhood?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  };
};

function formatNominatim(r: NominatimResult): string {
  const a = r.address ?? {};
  const primary =
    r.name ||
    a.city ||
    a.town ||
    a.village ||
    a.hamlet ||
    a.suburb ||
    a.neighbourhood ||
    a.county ||
    a.state_district ||
    (r.display_name ? r.display_name.split(",")[0].trim() : "");
  const state = a.state;
  if (primary && state && !primary.toLowerCase().includes(state.toLowerCase())) {
    return `${primary}, ${state}`;
  }
  return primary || r.display_name;
}

export function LocationPickerModal({ open, onClose, userId }: Props) {
  const { t } = useI18n();
  const user = useUserProfile();
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(searchCities("", 20));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults(searchCities(q, 20));
      setSearching(false);
      abortRef.current?.abort();
      return;
    }

    setSearching(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const timer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          q,
        )}&countrycodes=in&format=json&limit=10&addressdetails=1`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("nominatim failed");
        const data = (await res.json()) as NominatimResult[];
        const names: string[] = [];
        const seen = new Set<string>();
        for (const r of data) {
          const name = formatNominatim(r);
          const key = name.toLowerCase();
          if (name && !seen.has(key)) {
            seen.add(key);
            names.push(name);
          }
        }
        if (!ctrl.signal.aborted) {
          setResults(names.length > 0 ? names : searchCities(q, 20));
        }
      } catch (e) {
        if (!ctrl.signal.aborted) {
          setResults(searchCities(q, 20));
        }
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, open]);

  if (!open) return null;

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
            {searching ? (
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="size-4 text-muted-foreground" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("city.searchPh")}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("city.typeHint")}</p>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-4">
          {searching && results.length === 0 ? (
            <li className="px-5 py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{t("city.searching")}</span>
            </li>
          ) : results.length === 0 ? (
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
                  <span className="flex items-center gap-3 min-w-0">
                    <MapPin className="size-4 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{city}</span>
                  </span>
                  {saving === city && <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
