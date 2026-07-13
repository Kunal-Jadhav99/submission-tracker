"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, CheckCircle2, Loader2, ChevronDown, UserCheck } from "lucide-react";
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
  // per-task user-picker open state
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);

  const userId = (session?.user as any)?.id;

  async function load() {
    setLoading(true);
    try {
      const [t, u] = await Promise.all([
        fetch("/api/tasks").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
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

  // Mark complete for a specific user (defaults to self)
  async function toggleComplete(taskId: string, targetUserId?: string) {
    setPickerOpen(null);
    try {
      await fetch("/api/task-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, userId: targetUserId }),
      });
      load();
    } catch { toast.error("Failed to update completion"); }
  }

  // Get initials for avatar
  function initials(name: string) {
    return name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
  }

  return (
    <div className="page-container space-y-5" onClick={() => setPickerOpen(null)}>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Shared Tasks &amp; Forms</h1>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass p-6 rounded-2xl w-full max-w-md animate-fade-in">
            <h2 className="font-semibold mb-4">{editItem ? "Edit" : "New"} Task</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Task name" className="input-field" required />
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                <option>Personal</option><option>Group Project</option><option>Admin Form</option>
              </select>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="input-field" required />
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input-field">
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
            const completions: any[] = t.completions ?? [];
            const completedUserIds = completions.map((c: any) => c.user?._id?.toString() ?? c.user?.toString());
            const isMeDone = completedUserIds.includes(userId);
            const progress = (completions.length / Math.max(users.length, 1)) * 100;
            const prio = PRIORITY_CONFIG[t.priority as keyof typeof PRIORITY_CONFIG];

            // Users NOT yet marked done (for the picker)
            const pendingUsers = users.filter(u => !completedUserIds.includes(u._id?.toString()));

            return (
              <div key={t._id} className="glass p-4 rounded-xl border border-border/50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={cn("font-semibold", isMeDone && "line-through text-muted-foreground")}>{t.name}</h3>
                      <span className="text-xs text-muted-foreground">{t.type} • {formatDeadline(t.deadline).label}</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", prio?.bg, prio?.color, prio?.border)}>{t.priority}</span>
                      <button onClick={() => handleDelete(t._id)} className="text-muted-foreground hover:text-destructive ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Group progress bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Group Progress</span>
                      <span>{completions.length}/{users.length}</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  {/* Who completed + marked by whom */}
                  {completions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {completions.map((c: any) => {
                        const forName = c.user?.name ?? "Unknown";
                        const byName = c.markedBy?.name ?? forName;
                        const byId = c.markedBy?._id?.toString() ?? c.markedBy?.toString();
                        const forId = c.user?._id?.toString() ?? c.user?.toString();
                        const isSelf = byId === forId;
                        return (
                          <div key={c._id ?? forId} className="flex items-center gap-2">
                            {/* Avatar */}
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/50 to-secondary flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-white">{initials(forName)}</span>
                            </div>
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="font-medium">{forName}</span>
                              {!isSelf && (
                                <span className="text-muted-foreground">
                                  &nbsp;(marked by <span className="text-foreground">{byName}</span>)
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mark complete buttons */}
                <div className="mt-4 relative" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1.5">
                    {/* Self mark */}
                    <button
                      onClick={() => toggleComplete(t._id, userId)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-xs font-medium flex justify-center items-center gap-1.5 transition-colors",
                        isMeDone
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isMeDone ? "You: Done" : "Mark My Done"}
                    </button>

                    {/* Mark for others — dropdown trigger */}
                    <button
                      onClick={() => setPickerOpen(pickerOpen === t._id ? null : t._id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary/40 text-foreground hover:bg-secondary/60 flex items-center gap-1 transition-colors"
                      title="Mark complete for someone else"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Dropdown: pick user to mark */}
                  {pickerOpen === t._id && (
                    <div className="absolute right-0 bottom-full mb-1.5 z-30 glass border border-border/60 rounded-xl shadow-xl p-2 min-w-[180px] space-y-1">
                      <p className="text-[10px] text-muted-foreground px-2 pb-1 border-b border-border/40">Mark complete for…</p>
                      {users.map(u => {
                        const uid = u._id?.toString();
                        const done = completedUserIds.includes(uid);
                        return (
                          <button
                            key={uid}
                            onClick={() => toggleComplete(t._id, uid)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors",
                              done
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-foreground hover:bg-primary/10"
                            )}
                          >
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/50 to-secondary flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-white">{initials(u.name)}</span>
                            </div>
                            <span className="flex-1 text-left">{u.name}</span>
                            {done && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
