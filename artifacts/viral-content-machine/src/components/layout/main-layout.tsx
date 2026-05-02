import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, FileText, Video, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Pipeline" },
    { href: "/topics", icon: Activity, label: "Topics" },
    { href: "/scripts", icon: FileText, label: "Scripts" },
    { href: "/videos", icon: Video, label: "Videos" },
    { href: "/generate", icon: Sparkles, label: "Generate", primary: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold tracking-tighter uppercase flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            Viral Machine
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm uppercase tracking-wider font-medium transition-colors border border-transparent",
                    active
                      ? "bg-secondary text-foreground border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    item.primary && !active && "text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
