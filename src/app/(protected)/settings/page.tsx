"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Bell, Shield, Paintbrush } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="page-container max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-4">
        {/* Appearance */}
        <section className="glass rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Paintbrush className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", icon: Sun, label: "Light" },
              { id: "dark", icon: Moon, label: "Dark" },
              { id: "system", icon: Monitor, label: "System" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border transition-all",
                  theme === t.id 
                    ? "bg-primary/10 border-primary text-primary" 
                    : "bg-secondary/40 border-border/50 text-muted-foreground hover:bg-secondary"
                )}
              >
                <t.icon className="w-5 h-5 mb-2" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="glass rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive daily summaries</p>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer opacity-50">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic text-center">Notification settings are globally locked for the group.</p>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="glass rounded-2xl p-6 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Privacy & Security</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            This workspace operates on a principle of absolute transparency. All three friends have equal permissions to view, edit, and delete any content. There are no private tasks or hidden data.
          </p>
        </section>
      </div>
    </div>
  );
}
