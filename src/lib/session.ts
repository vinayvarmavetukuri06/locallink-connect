// Session management for custom password-based auth
const SESSION_KEY = "lc:session";

export type Session = {
  role: "customer" | "worker";
  userId: string;
  name: string;
  mobile: string;
};

export function saveSession(session: Session) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("lc:user-id");
  localStorage.removeItem("lc:member-profile-id");
  localStorage.removeItem("lc:worker-id");
  localStorage.removeItem("lc:user-profile");
  localStorage.removeItem("lc:member-profile");
}
