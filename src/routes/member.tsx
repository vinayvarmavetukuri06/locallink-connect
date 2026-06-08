import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/member")({
  component: MemberLayout,
});

function MemberLayout() {
  return (
    <div className="mobile-shell pb-24">
      <Outlet />
      <BottomNav variant="member" />
    </div>
  );
}
