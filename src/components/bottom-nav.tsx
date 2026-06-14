import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, MessageCircle, User, LayoutDashboard, BadgeIndianRupee, Users, Tag } from "lucide-react";
// Note: BadgeIndianRupee retained for admin nav only.
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

type NavItem = { to: string; labelKey: string; fallback: string; icon: ReactNode };

const userNav: NavItem[] = [
  { to: "/user", labelKey: "nav.home", fallback: "Home", icon: <Home className="size-5" /> },
  { to: "/user/bookings", labelKey: "nav.bookings", fallback: "Bookings", icon: <Calendar className="size-5" /> },
  { to: "/user/chat", labelKey: "nav.chat", fallback: "Chat", icon: <MessageCircle className="size-5" /> },
  { to: "/user/profile", labelKey: "nav.profile", fallback: "Profile", icon: <User className="size-5" /> },
];

const memberNav: NavItem[] = [
  { to: "/member", labelKey: "nav.home", fallback: "Home", icon: <LayoutDashboard className="size-5" /> },
  { to: "/member/bookings", labelKey: "nav.bookings", fallback: "Bookings", icon: <Calendar className="size-5" /> },
  { to: "/member/chat", labelKey: "nav.chat", fallback: "Chat", icon: <MessageCircle className="size-5" /> },
  { to: "/member/profile", labelKey: "nav.profile", fallback: "Profile", icon: <User className="size-5" /> },
];

const adminNav: NavItem[] = [
  { to: "/admin", labelKey: "nav.home", fallback: "Home", icon: <LayoutDashboard className="size-5" /> },
  { to: "/admin/workers", labelKey: "nav.workers", fallback: "Workers", icon: <Users className="size-5" /> },
  { to: "/admin/categories", labelKey: "nav.cats", fallback: "Cats", icon: <Tag className="size-5" /> },
  { to: "/admin/bookings", labelKey: "nav.bookings", fallback: "Bookings", icon: <Calendar className="size-5" /> },
  { to: "/admin/subscriptions", labelKey: "nav.plan", fallback: "Plans", icon: <BadgeIndianRupee className="size-5" /> },
];

export function BottomNav({ variant }: { variant: "user" | "member" | "admin" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  const items = variant === "user" ? userNav : variant === "member" ? memberNav : adminNav;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border px-4 py-2.5 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      {items.map((item) => {
        const active =
          item.to === `/${variant}`
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + "/");
        const label = t(item.labelKey) === item.labelKey ? item.fallback : t(item.labelKey);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className={active ? "scale-110 transition-transform" : ""}>{item.icon}</div>
            <span className="text-[10px] font-bold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
