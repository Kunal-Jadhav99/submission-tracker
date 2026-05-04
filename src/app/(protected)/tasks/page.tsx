"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Edit, CheckCircle2, X, Loader2 } from "lucide-react";
import { cn, PRIORITY_CONFIG, formatDeadline } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "Personal", deadline: "", priority: "Medium" });

  const userId = (session?.user as any)?.id;

  async function load() {
    setLoading(true);
    try {
      const [t, u] = await Promise.all([
        fetch("/api/tasks").then(r => r.json()),
        fetch("/api/users").then(r => r.json())
      ]);
      setTasks(Array.isArray(t) ? t : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch { toast.error("Failed to load tasks"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editItem) {
        await fetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem._id, ...form }) });
      } else {
        await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      toast.success("Saved");
      setShowForm(false); setEditItem(null); setForm({ name: "", type: "Personal", deadline: "", priority: "Medium" });
      load();
    } catch { toast.error("Error saving"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete task?")) return;
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    load();
  }

  async function toggleComplete(taskId: string) {
    await fetch("/api/task-completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId }) });
    load();
  }

  return (
    <div className="page-container space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Shared Tasks & Forms</h1>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/> Add Task</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass p-6 rounded-2xl w-full max-w-md animate-fade-in">
            <h2 className="font-semibold mb-4">{editItem ? "Edit" : "New"} Task</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Task name" className="input-field" required />
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
                <option>Personal</option><option>Group Project</option><option>Admin Form</option>
              </select>
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="input-field" required />
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input-field">
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {tasks.map(t => {
            const completedBy = t.completions?.map((c: any) => c.user?._id ?? c.user) || [];
            const isDone = completedBy.includes(userId);
            const progress = (completedBy.length / Math.max(users.length, 1)) * 100;
            const prio = PRIORITY_CONFIG[t.priority as keyof typeof PRIORITY_CONFIG];

            return (
              <div key={t._id} className="glass p-4 rounded-xl border border-border/50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={cn("font-semibold", isDone && "line-through text-muted-foreground")}>{t.name}</h3>
                      <span className="text-xs text-muted-foreground">{t.type} • {formatDeadline(t.deadline).label}</span>
                    </div>
                    <div className="flex gap-1">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", prio?.bg, prio?.color, prio?.border)}>{t.priority}</span>
                      <button onClick={() => handleDelete(t._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Group Progress</span>
                      <span>{completedBy.length}/{users.length}</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
                <button onClick={() => toggleComplete(t._id)} className={cn("mt-4 w-full py-1.5 rounded-lg text-xs font-medium flex justify-center items-center gap-1.5 transition-colors", isDone ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary hover:bg-primary/20")}>
                  <CheckCircle2 className="w-4 h-4" /> {isDone ? "Completed" : "Mark Complete"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
