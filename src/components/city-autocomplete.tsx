import { useEffect, useRef, useState, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { searchCities } from "@/lib/indian-cities";
import { useI18n } from "@/lib/i18n";

type Variant = "secondary" | "card";

type Props = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  icon?: ReactNode;
  variant?: Variant;
  autoFocus?: boolean;
};

export function CityAutocomplete({
  value,
  onChange,
  label,
  placeholder,
  hint,
  icon,
  variant = "secondary",
  autoFocus,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const suggestions = searchCities(value, 8);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const wrapperCls =
    variant === "card"
      ? "mt-1.5 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5"
      : "mt-2 flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3.5";

  return (
    <div ref={wrapRef} className="relative">
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className={wrapperCls}>
        <span className="text-muted-foreground shrink-0">
          {icon ?? <MapPin className="size-4" />}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? t("city.placeholder")}
          autoFocus={autoFocus}
          autoComplete="off"
          className="flex-1 bg-transparent outline-none text-sm font-medium"
        />
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-lg"
        >
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                onClick={() => {
                  onChange(city);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm hover:bg-secondary"
              >
                <MapPin className="size-3.5 text-muted-foreground" />
                <span>{city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
