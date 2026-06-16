import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";

export function LanguageButton({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change language"
        className={`size-10 rounded-full flex items-center justify-center border transition-colors ${
          isDark
            ? "bg-background/15 border-background/20 text-background hover:bg-background/25"
            : "bg-secondary border-border text-foreground hover:bg-secondary/80"
        } ${className}`}
      >
        <Globe className="size-[18px]" />
      </button>
      {open && <LanguageSheet onClose={() => setOpen(false)} />}
    </>
  );
}

export function LanguageSheet({ onClose }: { onClose: () => void }) {
  const { lang, setLang, t } = useI18n();
  function pick(l: Lang) {
    setLang(l);
    onClose();
  }
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-end animate-backdrop-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-card rounded-t-3xl p-6 pb-10 animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-4" />
        <h2 className="font-serif text-xl text-foreground">{t("lang.choose")}</h2>
        <p className="text-xs text-muted-foreground mt-1">{t("lang.subtitle")}</p>

        <div className="mt-5 space-y-2">
          {LANGUAGES.map((l) => {
            const selected = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => pick(l.code)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-colors text-left ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {l.flag}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm font-sans text-foreground">{l.native}</p>
                  <p className="text-[11px] text-muted-foreground">{l.english}</p>
                </div>
                {selected && (
                  <span className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="size-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
