"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Menu, Sun, Moon, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-30">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-foreground hidden sm:block">{title}</h2>
      </div>

      {/* Right: theme toggle + user */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {session?.user && (
          <div className="flex items-center gap-2 ml-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
                `bg-gradient-to-br ${(session.user as any).gradient ?? "from-violet-500 to-indigo-500"}`
              )}
            >
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
