"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Activity, Clock, CheckCircle2, AlertTriangle, Users, BookOpen } from "lucide-react";
import { cn, formatDeadline } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [a, e, t, l] = await Promise.all([
          fetch("/api/assignments").then(r => r.json()),
          fetch("/api/exams").then(r => r.json()),
          fetch("/api/tasks").then(r => r.json()),
          fetch("/api/activity?limit=5").then(r => r.json())
        ]);
        setStats({ assignments: a, exams: e, tasks: t, logs: l });
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex h-[50vh] items-center justify-center">Loading...</div>;

  const upcoming = [...(stats.assignments || []), ...(stats.tasks || [])]
    .filter(i => new Date(i.dueDate || i.deadline) > new Date())
    .sort((a, b) => new Date(a.dueDate || a.deadline).getTime() - new Date(b.dueDate || b.deadline).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground text-sm">Here is what's happening across your study group.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-border/50">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-400"/><span className="text-sm">Assignments</span></div>
          <p className="text-2xl font-bold">{stats.assignments?.length || 0}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-border/50">
          <div className="flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-violet-400"/><span className="text-sm">Exams</span></div>
          <p className="text-2xl font-bold">{stats.exams?.length || 0}</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-border/50">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-400"/><span className="text-sm">Tasks</span></div>
          <p className="text-2xl font-bold">{stats.tasks?.length || 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 border border-border/50">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Upcoming Deadlines</h2>
          <div className="space-y-3">
            {upcoming.map((item: any, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
                <div>
                  <p className="text-sm font-medium">{item.title || item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.subject?.name || item.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{formatDeadline(item.dueDate || item.deadline).label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-border/50">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Recent Activity</h2>
          <div className="space-y-3">
            {stats.logs?.map((log: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <div className="w-2 h-2 rounded-full mt-1.5 bg-primary shrink-0" />
                <div>
                  <p className="text-sm"><span className="font-semibold">{log.user?.name}</span> {log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
