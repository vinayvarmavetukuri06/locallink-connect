import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MessageSquareOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/user/chat/")({
  component: Chat,
});

type Convo = {
  otherId: string;
  name: string;
  initials: string;
  lastMessage: string;
  lastAt: string | null;
  unread: number;
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("") || "?";
}

function timeShort(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString();
}

function Chat() {
  const { t } = useI18n();
  const meId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;
  const [loading, setLoading] = useState(true);
  const [convos, setConvos] = useState<Convo[]>([]);

  useEffect(() => {
    if (!meId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      // 1. bookings where I'm customer with active statuses
      const { data: bks } = await supabase
        .from("bookings")
        .select("worker_id")
        .eq("customer_id", meId!)
        .in("status", ["pending", "accepted", "in_progress"]);
      const workerRowIds = Array.from(
        new Set((bks ?? []).map((b: any) => b.worker_id).filter(Boolean)),
      ) as string[];
      if (workerRowIds.length === 0) {
        if (!cancelled) { setConvos([]); setLoading(false); }
        return;
      }
      // 2. map worker_profiles → user_id
      const { data: wps } = await supabase
        .from("worker_profiles")
        .select("id, user_id")
        .in("id", workerRowIds);
      const otherIds = Array.from(
        new Set((wps ?? []).map((w: any) => w.user_id).filter(Boolean)),
      ) as string[];
      if (otherIds.length === 0) {
        if (!cancelled) { setConvos([]); setLoading(false); }
        return;
      }
      // 3. fetch profiles
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", otherIds);
      const nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name ?? ""]));
      // 4. fetch all messages between me and any otherIds
      const { data: msgs } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, message, created_at, is_read")
        .or(`sender_id.eq.${meId},receiver_id.eq.${meId}`)
        .order("created_at", { ascending: false });

      const list: Convo[] = otherIds.map((oid) => {
        const lastMsg = (msgs ?? []).find(
          (m: any) =>
            (m.sender_id === meId && m.receiver_id === oid) ||
            (m.sender_id === oid && m.receiver_id === meId),
        ) as any;
        const unread = (msgs ?? []).filter(
          (m: any) => m.sender_id === oid && m.receiver_id === meId && !m.is_read,
        ).length;
        const name = nameMap.get(oid) || t("userBookings.unknownWorker");
        return {
          otherId: oid,
          name,
          initials: initialsOf(name),
          lastMessage: lastMsg?.message ?? t("chat.noMessagesYet"),
          lastAt: lastMsg?.created_at ?? null,
          unread,
        };
      });
      // sort: those with messages first by lastAt desc, then alphabetical
      list.sort((a, b) => {
        if (a.lastAt && b.lastAt) return b.lastAt.localeCompare(a.lastAt);
        if (a.lastAt) return -1;
        if (b.lastAt) return 1;
        return a.name.localeCompare(b.name);
      });
      if (!cancelled) { setConvos(list); setLoading(false); }
    }

    load();
    const ch = supabase
      .channel(`user-chat-list-${meId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => load(),
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [meId, t]);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">{t("chat.title")}</h1>
      </header>
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : convos.length === 0 ? (
          <div className="mt-8 bg-card border border-dashed border-border rounded-3xl p-6 text-center">
            <div className="mx-auto size-16 rounded-2xl bg-secondary flex items-center justify-center mb-3">
              <MessageSquareOff className="size-7 text-muted-foreground" />
            </div>
            <p className="font-bold text-sm font-sans">{t("chat.noConversations")}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {t("chat.noConversationsSubUser")}
            </p>
            <Link
              to="/user"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold px-5 py-3 rounded-2xl active:scale-95 transition"
            >
              {t("chat.findWorker")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {convos.map((c) => (
              <li key={c.otherId}>
                <Link
                  to="/user/chat/$otherId"
                  params={{ otherId: c.otherId }}
                  className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 active:scale-[0.99] transition"
                >
                  <div className="size-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm font-sans truncate">{c.name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeShort(c.lastAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${c.unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                        {c.lastMessage}
                      </p>
                      {c.unread > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
