import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  userId: string | null;
  to: "/user/notifications" | "/member/notifications";
  variant?: "light" | "dark";
};

export function NotificationBell({ userId, to, variant = "light" }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      const { count: c } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId!)
        .eq("read", false);
      if (!cancelled) setCount(c ?? 0);
    }
    load();
    const ch = supabase
      .channel(`notif-bell-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [userId]);

  const base =
    variant === "dark"
      ? "size-10 rounded-full bg-background/10 backdrop-blur-md flex items-center justify-center relative mt-1 text-primary-foreground"
      : "size-9 rounded-full bg-secondary border border-border flex items-center justify-center relative";

  return (
    <Link to={to} className={base} aria-label="Notifications">
      <Bell className="size-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-warning text-warning-foreground text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-card">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
