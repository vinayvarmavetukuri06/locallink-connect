import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY = "admin_authed";

function AdminLayout() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setAuthed(sessionStorage.getItem(STORAGE_KEY) === "1");
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!authed) {
    return (
      <div className="mobile-shell min-h-screen flex items-center justify-center px-5 bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center mb-4">
            <Lock className="size-5" />
          </div>
          <h1 className="font-serif text-2xl font-bold">Admin Login</h1>
          <p className="text-xs text-muted-foreground mt-1">Enter the admin password to continue.</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem(STORAGE_KEY, "1");
                setAuthed(true);
                setError("");
              } else {
                setError("Incorrect password");
              }
            }}
          >
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button type="submit" className="w-full bg-foreground text-background font-bold py-3 rounded-xl text-sm">
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-shell pb-10">
      <div className="flex items-center justify-between px-5 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Console</span>
        <button
          onClick={() => {
            sessionStorage.removeItem(STORAGE_KEY);
            setAuthed(false);
            navigate({ to: "/" });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 px-3 py-1.5 rounded-lg"
        >
          <LogOut className="size-3.5" /> Logout
        </button>
      </div>
      <Outlet />
    </div>
  );
}
