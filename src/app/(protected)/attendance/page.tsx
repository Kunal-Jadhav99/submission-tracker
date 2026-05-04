"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { cn, SUBJECT_COLORS } from "@/lib/utils";
import { toast } from "sonner";

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [r, s, u] = await Promise.all([
        fetch("/api/attendance").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
        fetch("/api/users").then(r => r.json())
      ]);
      setRecords(Array.isArray(r) ? r : []);
      setSubjects(Array.isArray(s) ? s.filter((x:any) => !x.archived) : []);
      setUsers(Array.isArray(u) ? u : []);
      if (s.length > 0 && !selectedSubject) setSelectedSubject(s[0]._id);
    } catch { toast.error("Load failed"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleMark(uId: string, status: "Present"|"Absent") {
    if (!selectedSubject) return toast.error("Select subject");
    const date = format(new Date(), "yyyy-MM-dd");
    await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: uId, subjectId: selectedSubject, date, status }) });
    toast.success("Saved");
    load();
  }

  const subjectRecords = records.filter(r => (r.subject?._id ?? r.subject) === selectedSubject);
  const dates = Array.from(new Set(subjectRecords.map(r => format(new Date(r.date), "yyyy-MM-dd")))).sort().reverse().slice(0, 10);

  return (
    <div className="page-container space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl font-bold">Attendance</h1>
        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="input-field max-w-xs">
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {users.map(u => {
              const uRecs = subjectRecords.filter(r => (r.user?._id ?? r.user) === u._id);
              const total = uRecs.length;
              const pres = uRecs.filter(r => r.status === "Present").length;
              const perc = total ? Math.round((pres/total)*100) : 100;
              const needed = perc < 75 ? Math.ceil((0.75 * total - pres) / 0.25) : 0;
              const color = perc >= 75 ? "text-emerald-400" : perc >= 60 ? "text-amber-400" : "text-rose-400";

              return (
                <div key={u._id} className="glass p-5 rounded-2xl border border-border/50 text-center relative overflow-hidden">
                  <div className={cn("absolute top-0 left-0 w-full h-1", perc >= 75 ? "bg-emerald-500" : perc >= 60 ? "bg-amber-500" : "bg-rose-500")} />
                  <h3 className="font-bold text-lg">{u.name}</h3>
                  <div className={cn("text-3xl font-black my-2", color)}>{perc}%</div>
                  <p className="text-xs text-muted-foreground mb-4">{pres} / {total} classes attended</p>
                  {needed > 0 && <p className="text-xs text-rose-400 font-semibold mb-4 bg-rose-500/10 py-1 rounded">Needs {needed} more to hit 75%</p>}
                  
                  <div className="flex gap-2">
                    <button onClick={() => handleMark(u._id, "Present")} className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors">Present</button>
                    <button onClick={() => handleMark(u._id, "Absent")} className="flex-1 py-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors">Absent</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
