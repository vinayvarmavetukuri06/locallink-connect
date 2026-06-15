import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Msg = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

type Props = {
  meId: string | null;
  otherId: string;
  /** booking_id used when sending a new message; resolved from latest booking between the pair */
  resolveBookingId: () => Promise<string | null>;
  /** route to return to when back is tapped */
  backTo: "/user/chat" | "/member/chat";
  /** fallback display name when profile lookup fails */
  fallbackName: string;
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("") || "?";
}

function timeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatRoom({ meId, otherId, resolveBookingId, backTo, fallbackName }: Props) {
  const { t } = useI18n();
  const [otherName, setOtherName] = useState<string>(fallbackName);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Fetch other party name
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", otherId)
        .maybeSingle();
      if (!cancelled && (data as any)?.full_name) setOtherName((data as any).full_name);
    })();
    return () => { cancelled = true; };
  }, [otherId]);

  // Load + subscribe to messages
  useEffect(() => {
    if (!meId) { setLoading(false); return; }
    let cancelled = false;

    async function loadAndMarkRead() {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, message, is_read, created_at")
        .or(
          `and(sender_id.eq.${meId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${meId})`,
        )
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setMessages((data ?? []) as Msg[]);
        setLoading(false);
      }
      // mark inbound as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", otherId)
        .eq("receiver_id", meId!)
        .eq("is_read", false);
    }

    loadAndMarkRead();

    const ch = supabase
      .channel(`chat-${meId}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Msg;
          const matches =
            (m.sender_id === meId && m.receiver_id === otherId) ||
            (m.sender_id === otherId && m.receiver_id === meId);
          if (!matches) return;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id === otherId && m.receiver_id === meId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", m.id)
              .then(() => {});
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => prev.map((p) => (p.id === m.id ? m : p)));
        },
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [meId, otherId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !meId || sending) return;
    setSending(true);
    const bookingId = await resolveBookingId();
    const { error } = await supabase.from("messages").insert({
      booking_id: bookingId,
      sender_id: meId,
      receiver_id: otherId,
      message: body,
    });
    setSending(false);
    if (!error) setText("");
  }

  return (
    <>
      <header className="bg-card px-4 pt-5 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <Link to={backTo} aria-label={t("common.back")}>
          <ArrowLeft className="size-5" />
        </Link>
        <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
          {initialsOf(otherName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-base font-sans truncate">{otherName}</p>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="px-4 py-4 space-y-2 bg-secondary/30 min-h-[calc(100vh-10rem)]"
        style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom))" }}
      >
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">{t("chat.noMessagesYet")}</div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm ${
                  mine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card text-foreground border border-border rounded-bl-md"
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70 text-right" : "text-muted-foreground"}`}>
                    {timeOnly(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={send}
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-3 py-2 flex items-center gap-2 z-40"
        style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chat.typeMessage")}
          className="flex-1 h-11 px-4 rounded-full bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          autoFocus
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label={t("chat.send")}
          className="size-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 active:scale-95 transition shrink-0"
        >
          <Send className="size-4" />
        </button>
      </form>
    </>
  );
}
