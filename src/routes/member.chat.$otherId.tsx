import { createFileRoute, useParams } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ChatRoom } from "@/components/chat-room";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/member/chat/$otherId")({
  component: MemberChatScreen,
});

function MemberChatScreen() {
  const { t } = useI18n();
  const { otherId } = useParams({ from: "/member/chat/$otherId" });
  const meId = typeof window !== "undefined" ? localStorage.getItem("lc:user-id") : null;

  // Worker side: otherId = customer's profile.id
  async function resolveBookingId(): Promise<string | null> {
    if (!meId) return null;
    const { data: wp } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("user_id", meId)
      .maybeSingle();
    const workerRowId = (wp as any)?.id as string | undefined;
    if (!workerRowId) return null;
    const { data: bks } = await supabase
      .from("bookings")
      .select("id, created_at")
      .eq("customer_id", otherId)
      .eq("worker_id", workerRowId)
      .in("status", ["pending", "accepted", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1);
    return (bks?.[0] as any)?.id ?? null;
  }

  return (
    <ChatRoom
      meId={meId}
      otherId={otherId}
      resolveBookingId={resolveBookingId}
      backTo="/member/chat"
      fallbackName={t("memberHome.customer")}
    />
  );
}
