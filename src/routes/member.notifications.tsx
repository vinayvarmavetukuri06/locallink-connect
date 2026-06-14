import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/member/notifications")({
  component: MemberNotificationsPage,
});

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function MemberNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("lc:member-profile-id") : null;

  async function load() {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, type, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    load();
    supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false).then(() => {});
    const ch = supabase
      .channel(`notif-list-member-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <Link to="/member"><ArrowLeft className="size-5" /></Link>
        <h1 className="font-serif text-2xl">Notifications</h1>
      </header>
      <section className="px-5 py-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-3xl p-8 text-center">
            <Bell className="size-7 text-muted-foreground mx-auto mb-2" />
            <p className="font-bold text-sm font-sans">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">You're all caught up.</p>
          </div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
              <div className="mt-1.5">
                {!n.read ? (
                  <span className="size-2.5 rounded-full bg-primary inline-block" />
                ) : (
                  <span className="size-2.5 rounded-full bg-transparent inline-block" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm font-sans">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
