import { createFileRoute } from "@tanstack/react-router";
import { chatThreads } from "@/lib/mock-data";

export const Route = createFileRoute("/member/chat")({
  component: MemberChat,
});

function MemberChat() {
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">Customer Chats</h1>
      </header>
      <div className="px-5 py-4 space-y-2">
        {chatThreads.map((t, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center">
              {["RS", "VJ"][i] || "CU"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="font-bold text-sm font-sans">{["Rahul Sharma", "Vikas Jain"][i] || "Customer"}</p>
                <span className="text-[10px] text-muted-foreground">{t.time}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{t.lastMessage}</p>
            </div>
            {t.unread > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full size-5 flex items-center justify-center">
                {t.unread}
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
