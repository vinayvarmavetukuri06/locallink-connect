import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/user")({
  component: UserLayout,
});

function UserLayout() {
  return (
    <div className="mobile-shell pb-24">
      <Outlet />
      <BottomNav variant="user" />
    </div>
  );
}
