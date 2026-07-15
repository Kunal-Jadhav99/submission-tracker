"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, CheckCircle2, Clock, X, Loader2, ArrowLeft } from "lucide-react";
import { cn, SUBJECT_COLORS, PRIORITY_CONFIG, formatDeadline, autoPriority } from "@/lib/utils";
import { toast } from "sonner";
import SubjectHub from "@/components/SubjectHub";

const CATEGORIES = ["Lab", "Theory", "Project", "Presentation", "Quiz", "Admin"];

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ subject: "", title: "", description: "", dueDate: "", category: "Theory" });

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
      setSubjects(Array.isArray(s) ? s : []);
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
      } else {
        await fetch("/api/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        toast.success("Assignment added ✅");
      }
      closeForm(); load();
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
    setForm({ subject: a.subject?._id ?? a.subject, title: a.title, description: a.description ?? "", dueDate: format(new Date(a.dueDate), "yyyy-MM-dd"), category: a.category });
    setShowForm(true);
  }

  function openNew() {
    setEditItem(null);
    setForm({ subject: selectedSubject ?? "", title: "", description: "", dueDate: "", category: "Theory" });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditItem(null); }

  // Build count map for SubjectHub
  const countMap: Record<string, number> = {};
  assignments.forEach(a => {
    const sid = a.subject?._id ?? a.subject;
    countMap[sid] = (countMap[sid] || 0) + 1;
  });

  const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const subjectAssignments = selectedSubject
    ? assignments
      .filter(a => (a.subject?._id ?? a.subject) === selectedSubject)
      .sort((a, b) => PRIORITY_ORDER[autoPriority(a.dueDate)] - PRIORITY_ORDER[autoPriority(b.dueDate)])
    : [];

  const currentSubject = subjects.find(s => s._id === selectedSubject);
  const subjectColor = currentSubject ? SUBJECT_COLORS[(currentSubject.color ?? 0) % SUBJECT_COLORS.length] : null;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedSubject && (
            <button onClick={() => setSelectedSubject(null)} className="p-2 glass rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold">
              {selectedSubject ? currentSubject?.name : "Assignments"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedSubject ? `${subjectAssignments.length} assignments · Prof. ${currentSubject?.professor}` : "Select a subject to view its assignments"}
            </p>
          </div>
        </div>
        {selectedSubject && (
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Assignment
          </button>
        )}
      </div>

      {/* Subject cards or assignment list */}
      {!selectedSubject ? (
        <SubjectHub
          subjects={subjects}
          selected={selectedSubject}
          onSelect={setSelectedSubject}
          countMap={countMap}
          countLabel="assignments"
          loading={loading}
        />
      ) : (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : subjectAssignments.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center border border-dashed border-border/50">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No assignments for this subject yet</p>
              <button onClick={openNew} className="btn-primary mt-4 mx-auto flex items-center gap-2"><Plus className="w-4 h-4" /> Add First Assignment</button>
            </div>
          ) : (
            subjectAssignments.map(a => (
              <AssignmentRow key={a._id} a={a} users={users} userId={userId} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleSubmission} />
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editItem ? "Edit Assignment" : "New Assignment"}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Assignment title" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">{editItem ? "Update" : "Create"}</button>
                <button type="button" onClick={closeForm} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentRow({ a, users, userId, onEdit, onDelete, onToggle }: any) {
  const priority = autoPriority(a.dueDate);
  const pConf = PRIORITY_CONFIG[priority];
  const { label: dueLabel, urgent, overdue } = formatDeadline(a.dueDate);
  const mySubmission = a.submissions?.find((s: any) => (s.user?._id ?? s.user) === userId);
  const submitted = !!mySubmission;

  return (
    <div className={cn("glass rounded-xl border p-4 transition-all card-hover", overdue && !submitted ? "border-rose-500/30" : "border-border/50")}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className={cn("font-semibold text-sm", submitted && "line-through text-muted-foreground")}>{a.title}</p>
              {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(a)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Edit className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(a._id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-priority badge */}
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide", pConf.bg, pConf.color, pConf.border)}>
              {priority}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{a.category}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1", overdue ? "bg-rose-500/10 text-rose-400" : urgent ? "bg-amber-500/10 text-amber-400" : "bg-secondary text-muted-foreground")}>
              <Clock className="w-3 h-3" />{dueLabel}
            </span>
          </div>

          {/* Who submitted */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {users.map((u: any) => {
              const sub = a.submissions?.find((s: any) => (s.user?._id ?? s.user) === u._id);
              return (
                <div key={u._id} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", sub ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary/50 text-muted-foreground border-border/30")}>
                  <div className={cn("w-3 h-3 rounded-full bg-gradient-to-br", u.gradient)} />
                  {u.name.split(" ")[0]}{sub?.isLate ? " (late)" : ""}
                </div>
              );
            })}
          </div>

          <button onClick={() => onToggle(a._id, a.dueDate)} className={cn("mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5", submitted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400" : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20")}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {submitted ? "Submitted — Click to undo" : "Mark as Submitted"}
          </button>
        </div>
      </div>
    </div>
  );
}
