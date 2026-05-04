"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, CheckCircle2, Clock, X, Loader2 } from "lucide-react";
import { cn, SUBJECT_COLORS, PRIORITY_CONFIG, formatDeadline } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = ["Lab", "Theory", "Project", "Presentation", "Quiz", "Admin"];
const PRIORITIES = ["High", "Medium", "Low"];

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [view, setView] = useState<"list" | "grid" | "kanban">("list");
  const [form, setForm] = useState({
    subject: "", title: "", description: "", dueDate: "",
    category: "Theory", priority: "Medium",
  });

  const userId = (session?.user as any)?.id;

  async function load() {
    setLoading(true);
    try {
      const [a, s, u] = await Promise.all([
        fetch("/api/assignments").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
      ]);
      setAssignments(Array.isArray(a) ? a : []);
      setSubjects(Array.isArray(s) ? s.filter((x: any) => !x.archived) : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch { toast.error("Failed to load data"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject || !form.title || !form.dueDate) { toast.error("Fill required fields"); return; }
    try {
      if (editItem) {
        await fetch("/api/assignments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem._id, ...form }) });
        toast.success("Assignment updated");
      } else {
        await fetch("/api/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        toast.success("Assignment added ✅");
      }
      setShowForm(false); setEditItem(null);
      setForm({ subject: "", title: "", description: "", dueDate: "", category: "Theory", priority: "Medium" });
      load();
    } catch { toast.error("Failed to save"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this assignment?")) return;
    await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
    toast.success("Deleted"); load();
  }

  async function toggleSubmission(assignmentId: string, dueDate: string) {
    const isLate = new Date() > new Date(dueDate);
    await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId, isLate }) });
    load();
  }

  function openEdit(a: any) {
    setEditItem(a);
    setForm({ subject: a.subject?._id ?? a.subject, title: a.title, description: a.description ?? "", dueDate: format(new Date(a.dueDate), "yyyy-MM-dd"), category: a.category, priority: a.priority });
    setShowForm(true);
  }

  const filtered = assignments.filter(a => {
    if (filterSubject && (a.subject?._id ?? a.subject) !== filterSubject) return false;
    if (filterPriority && a.priority !== filterPriority) return false;
    return true;
  });

  const kanbanCols = [
    { label: "To Do", items: filtered.filter(a => !a.submissions?.length) },
    { label: "Submitted", items: filtered.filter(a => a.submissions?.length > 0) },
  ];

  return (
    <div className="page-container space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-xl font-bold text-foreground">Assignments</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex bg-secondary rounded-lg p-1 gap-1">
            {(["list","grid","kanban"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={cn("px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{v}</button>
            ))}
          </div>
          {/* Filters */}
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="input-field w-auto py-1.5 text-xs">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="input-field w-auto py-1.5 text-xs">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => { setEditItem(null); setForm({ subject: "", title: "", description: "", dueDate: "", category: "Theory", priority: "Medium" }); setShowForm(true); }} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">{editItem ? "Edit Assignment" : "New Assignment"}</h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" placeholder="Assignment title" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subject *</label>
                  <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input-field" required>
                    <option value="">Select subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input-field">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field resize-none" rows={2} placeholder="Optional description..." />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">{editItem ? "Update" : "Create"}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
          <p className="text-muted-foreground">No assignments found. Add one to get started!</p>
        </div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kanbanCols.map(col => (
            <div key={col.label} className="glass rounded-2xl p-4">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">{col.label} ({col.items.length})</h3>
              <div className="space-y-2">
                {col.items.map(a => <AssignmentCard key={a._id} a={a} users={users} userId={userId} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleSubmission} compact />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("gap-4", view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col")}>
          {filtered.map(a => (
            <AssignmentCard key={a._id} a={a} users={users} userId={userId} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleSubmission} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ a, users, userId, onEdit, onDelete, onToggle, compact }: any) {
  const subject = a.subject;
  const color = SUBJECT_COLORS[(subject?.colorIndex ?? 0) % SUBJECT_COLORS.length];
  const priority = PRIORITY_CONFIG[a.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.Medium;
  const { label: dueLabel, urgent, overdue } = formatDeadline(a.dueDate);
  const mySubmission = a.submissions?.find((s: any) => (s.user?._id ?? s.user) === userId);
  const submitted = !!mySubmission;

  return (
    <div className={cn("glass rounded-xl border card-hover transition-all", overdue && !submitted ? "border-rose-500/30" : "border-border/50", compact ? "p-3" : "p-4")}>
      <div className="flex items-start gap-3">
        <div className={cn("w-1 rounded-full shrink-0 self-stretch min-h-[40px]", color.bg)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{a.title}</p>
              {subject && <p className="text-xs text-muted-foreground">{subject.name}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(a)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(a._id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          {!compact && a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", priority.bg, priority.color, priority.border, "border")}>{a.priority}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{a.category}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full flex items-center gap-1", overdue ? "bg-rose-500/10 text-rose-400" : urgent ? "bg-amber-500/10 text-amber-400" : "bg-secondary text-muted-foreground")}>
              <Clock className="w-3 h-3" />{dueLabel}
            </span>
          </div>
          {/* Submission status */}
          {!compact && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {users.map((u: any) => {
                const sub = a.submissions?.find((s: any) => (s.user?._id ?? s.user) === u._id);
                return (
                  <div key={u._id} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", sub ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary text-muted-foreground border-border/30")}>
                    <div className={cn("w-3 h-3 rounded-full", `bg-gradient-to-br ${u.gradient}`)} />
                    {u.name}{sub?.isLate ? " (late)" : ""}
                  </div>
                );
              })}
            </div>
          )}
          <button
            onClick={() => onToggle(a._id, a.dueDate)}
            className={cn("mt-2 w-full py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5", submitted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20" : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20")}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {submitted ? "Submitted — Click to undo" : "Mark as Submitted"}
          </button>
        </div>
      </div>
    </div>
  );
}
