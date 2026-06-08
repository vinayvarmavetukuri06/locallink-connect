import { createFileRoute } from "@tanstack/react-router";
import { chatThreads, workerById } from "@/lib/mock-data";
import { WorkerAvatar } from "@/components/worker-card";
import { useState } from "react";
import { Send, ArrowLeft, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/user/chat")({
  component: Chat,
});

function Chat() {
  const [openId, setOpenId] = useState<string | null>(null);
  const thread = openId ? chatThreads.find((t) => t.workerId === openId) : null;
  const worker = thread ? workerById(thread.workerId) : null;
  const [draft, setDraft] = useState("");
  const [extraMsgs, setExtraMsgs] = useState<{ id: string; fromMe: boolean; text: string; time: string }[]>([]);

  if (thread && worker) {
    return (
      <>
        <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
          <button onClick={() => { setOpenId(null); setExtraMsgs([]); }}>
            <ArrowLeft className="size-5" />
          </button>
          <WorkerAvatar worker={worker} size="sm" />
          <div>
            <p className="font-bold text-sm font-sans">{worker.name}</p>
            <p className="text-[10px] text-success font-semibold">Online</p>
          </div>
        </header>

        <div className="px-5 py-4 space-y-2.5 pb-32">
          {[...thread.messages, ...extraMsgs].map((m) => (
            <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.fromMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary rounded-bl-sm"
                }`}
              >
                {m.text}
                <p className={`text-[10px] mt-1 ${m.fromMe ? "opacity-70" : "text-muted-foreground"}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-3 pb-2">
          <div className="bg-card border border-border rounded-3xl p-2 flex items-center gap-2 shadow-md">
            <button className="size-10 rounded-2xl bg-secondary flex items-center justify-center">
              <ImagePlus className="size-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-sm px-2"
            />
            <button
              onClick={() => {
                if (!draft.trim()) return;
                setExtraMsgs((m) => [...m, { id: String(Date.now()), fromMe: true, text: draft, time: "Now" }]);
                setDraft("");
              }}
              className="size-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">Messages</h1>
      </header>
      <div className="px-5 py-4 space-y-2">
        {chatThreads.map((t) => {
          const w = workerById(t.workerId);
          if (!w) return null;
          return (
            <button
              key={t.workerId}
              onClick={() => setOpenId(t.workerId)}
              className="w-full bg-card hover:bg-secondary border border-border rounded-2xl p-3 flex items-center gap-3 text-left transition-colors"
            >
              <WorkerAvatar worker={w} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-sm font-sans truncate">{w.name}</p>
                  <span className="text-[10px] text-muted-foreground">{t.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{t.lastMessage}</p>
              </div>
              {t.unread > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full size-5 flex items-center justify-center">
                  {t.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
