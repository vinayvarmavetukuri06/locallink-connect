import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/user/chat")({
  component: Chat,
});

function Chat() {
  const { t } = useI18n();
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">{t("chat.title")}</h1>
      </header>
      <div className="px-5 py-4">
        <div className="mt-8 bg-card border border-dashed border-border rounded-3xl p-6 text-center">
          <div className="mx-auto size-16 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            <MessageSquareOff className="size-7 text-muted-foreground" />
          </div>
          <p className="font-bold text-sm font-sans">{t("chat.empty")}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {t("chat.startNew")}
          </p>
          <Link
            to="/user"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold px-5 py-3 rounded-2xl active:scale-95 transition"
          >
            {t("chat.findWorker")}
          </Link>
        </div>
      </div>
    </>
  );
}
