import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="mobile-shell pb-24">
      <Outlet />
      <BottomNav variant="admin" />
    </div>
  );
}
