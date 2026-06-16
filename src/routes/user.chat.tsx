import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/user/chat")({
  component: () => <Outlet />,
});
