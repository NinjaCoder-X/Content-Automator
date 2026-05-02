"use client";
import {
  LayoutDashboard,
  Sparkles,
  History,
  BarChart3,
  CalendarRange,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate", icon: Sparkles, primary: true },
  { href: "/planner", label: "Planner", icon: CalendarRange },
  { href: "/history", label: "History", icon: History },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  user,
}: {
  user: { name: string; email: string; plan: string };
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 border-r border-border bg-surface/60 flex-col">
      <div className="p-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center shadow-glow">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span>AI Content Factory</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors border border-transparent",
                active
                  ? "bg-primary-500/10 text-white border-primary-500/30"
                  : "text-muted hover:text-white hover:bg-primary-500/5",
                item.primary && !active && "text-primary-400",
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-3">
        <div className="px-3 py-2 rounded-lg bg-elevated border border-border">
          <p className="text-xs text-muted">Signed in as</p>
          <p className="text-sm truncate">{user.name || user.email}</p>
          <p className="text-xs text-primary-400 uppercase tracking-wider mt-1">
            {user.plan} plan
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-primary-500/5"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
