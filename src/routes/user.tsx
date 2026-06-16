import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/user")({
  component: UserLayout,
});

function UserLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mobile-shell pb-24">
      <div key={pathname} className="animate-page-in">
        <Outlet />
      </div>
      <BottomNav variant="user" />
    </div>
  );
}
