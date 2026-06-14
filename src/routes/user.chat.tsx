import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareOff } from "lucide-react";

export const Route = createFileRoute("/user/chat")({
  component: Chat,
});

function Chat() {
  // Real chat threads are not yet implemented in the database.
  // Until a messages table exists we always show the empty state.
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30">
        <h1 className="font-serif text-2xl">Messages</h1>
      </header>
      <div className="px-5 py-4">
        <div className="mt-8 bg-card border border-dashed border-border rounded-3xl p-6 text-center">
          <div className="mx-auto size-16 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            <MessageSquareOff className="size-7 text-muted-foreground" />
          </div>
          <p className="font-bold text-sm font-sans">No more messages</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Start a new conversation by booking a worker.
          </p>
          <Link
            to="/user"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-bold px-5 py-3 rounded-2xl active:scale-95 transition"
          >
            Find a Worker
          </Link>
        </div>
      </div>
    </>
  );
}
