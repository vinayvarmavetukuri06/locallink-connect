import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ChatUnreadBadge() {
  const [count, setCount] = useState(0);
  const userId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const { count: c } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId!)
        .eq("is_read", false);
      if (!cancelled) setCount(c ?? 0);
    }
    load();

    const ch = supabase
      .channel(`chat-badge-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [userId]);

  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-warning text-warning-foreground text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-card">
      {count > 9 ? "9+" : count}
    </span>
  );
}
