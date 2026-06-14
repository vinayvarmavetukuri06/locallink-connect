import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/member/chat")({
  component: MemberChat,
});

function MemberChat() {
  const { t } = useI18n();
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">{t("chat.customerChats")}</h1>
      </header>
      <div className="px-5 py-4">
        <div className="mt-8 bg-card border border-dashed border-border rounded-3xl p-6 text-center">
          <div className="mx-auto size-16 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            <MessageSquareOff className="size-7 text-muted-foreground" />
          </div>
          <p className="font-bold text-sm font-sans">{t("chat.empty")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("chat.startNew")}</p>
        </div>
      </div>
    </>
  );
}
