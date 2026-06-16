import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/member")({
  component: MemberLayout,
});

function MemberLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mobile-shell pb-24">
      <main key={pathname} className="animate-page-in" id="main-content">
        <Outlet />
      </main>
      <BottomNav variant="member" />
    </div>
  );
}
