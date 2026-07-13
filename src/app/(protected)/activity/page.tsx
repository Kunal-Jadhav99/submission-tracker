"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Activity as ActivityIcon, CheckCircle2, Plus, FileText, BookOpen } from "lucide-react";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  completed_task: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  created_task: <Plus className="w-3.5 h-3.5 text-primary" />,
  created_assignment: <FileText className="w-3.5 h-3.5 text-sky-400" />,
  created_exam: <BookOpen className="w-3.5 h-3.5 text-amber-400" />,
};

function initials(name: string) {
  return name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-container max-w-2xl space-y-5">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <ActivityIcon className="w-5 h-5 text-primary" /> Activity Feed
      </h1>

      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /> : (
        <div className="space-y-3">
          {logs.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">No activity yet.</p>
          )}
          {logs.map(log => {
            const actorName: string = log.user?.name ?? "Someone";
            const details: string = log.details ?? log.action ?? "";
            const icon = ACTION_ICONS[log.action] ?? <ActivityIcon className="w-3.5 h-3.5 text-muted-foreground" />;

            // For completed_task entries, build a richer description
            let description: React.ReactNode = (
              <span className="text-sm">
                <span className="font-semibold text-foreground">{actorName}</span>{" "}
                <span className="text-muted-foreground">{details}</span>
              </span>
            );

            if (log.action === "completed_task") {
              const meta = log.meta;
              const isSelf = !meta || meta.isSelf;
              description = (
                <span className="text-sm">
                  <span className="font-semibold text-foreground">{actorName}</span>{" "}
                  <span className="text-emerald-400">✓ {isSelf ? "completed" : "marked complete"}</span>{" "}
                  {!isSelf && (
                    <>
                      <span className="text-muted-foreground">for </span>
                      <span className="font-semibold text-foreground">{meta?.forUserName ?? "someone"}</span>{" "}
                    </>
                  )}
                  {/* extract task name from details */}
                  <span className="text-muted-foreground">
                    {details.replace(/^marked task /, "").replace(/ as complete.*/, "")
                      .replace(/^completed task /, "")}
                  </span>
                </span>
              );
            }

            return (
              <div key={log._id} className="glass p-4 rounded-xl border border-border/50 flex gap-3 items-start">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-secondary flex items-center justify-center shrink-0 text-xs font-bold text-white">
                  {initials(actorName)}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Action tag + message */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted/40 border border-border/40 text-muted-foreground">
                      {icon}
                      {log.action?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-1">{description}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(log.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
