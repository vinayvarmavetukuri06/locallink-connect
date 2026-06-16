import { useI18n } from "@/lib/i18n";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "success" | "destructive";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant = "primary",
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  if (!open) return null;
  const variantCls =
    confirmVariant === "success"
      ? "bg-success text-success-foreground"
      : confirmVariant === "destructive"
        ? "bg-destructive text-destructive-foreground"
        : "bg-primary text-primary-foreground";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-sm rounded-3xl p-5">
        <h2 className="font-bold text-base font-sans">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-secondary disabled:opacity-50"
          >
            {cancelLabel ?? t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl ${variantCls} disabled:opacity-50`}
          >
            {busy ? "…" : (confirmLabel ?? t("common.confirm"))}
          </button>
        </div>
      </div>
    </div>
  );
}
