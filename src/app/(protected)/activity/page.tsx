"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Activity as ActivityIcon } from "lucide-react";

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity").then(r => r.json()).then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-container max-w-2xl space-y-5">
      <h1 className="text-xl font-bold flex items-center gap-2"><ActivityIcon className="w-5 h-5 text-primary"/> Activity Feed</h1>
      {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /> : (
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log._id} className="glass p-4 rounded-xl border border-border/50 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-secondary flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{log.user?.name?.[0] ?? "U"}</span>
              </div>
              <div>
                <p className="text-sm"><span className="font-semibold text-foreground">{log.user?.name}</span> {log.details}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(log.createdAt), "MMM d, h:mm a")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
