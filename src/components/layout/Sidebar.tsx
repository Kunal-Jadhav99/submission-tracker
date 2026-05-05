"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, ClipboardList, FileCheck, BarChart3,
  Calendar, Users, BookMarked, GraduationCap, Library, Clock,
  Activity, Search, X, Layers, FlaskConical, Settings, UserCircle
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/practicals", label: "Practicals", icon: FlaskConical },
  { href: "/exams", label: "Exams & Marks", icon: GraduationCap },
  { href: "/attendance", label: "Attendance", icon: Users },
  { href: "/tasks", label: "Tasks & Forms", icon: FileCheck },
  { href: "/resources", label: "Resources", icon: Library },
  { href: "/syllabus", label: "Syllabus", icon: Layers },
  { href: "/study-sessions", label: "Study Sessions", icon: BookMarked },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/activity", label: "Activity Log", icon: Activity },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 z-50 flex flex-col",
          "bg-card/95 backdrop-blur-xl border-r border-border/50",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0 md:static md:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">SubTrack</h1>
              <p className="text-[10px] text-muted-foreground">Academic Tracker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        {session?.user && (
          <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-secondary/50 border border-border/30">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                  `bg-gradient-to-br ${(session.user as any).gradient ?? "from-violet-500 to-indigo-500"}`
                )}
              >
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{session.user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "nav-item",
                  active ? "nav-item-active" : "nav-item-inactive"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>v1.0.0 — All equal access</span>
          </div>
        </div>
      </aside>
    </>
  );
}
