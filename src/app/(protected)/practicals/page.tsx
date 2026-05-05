"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, CheckCircle2, FlaskConical, X, ArrowLeft, Loader2 } from "lucide-react";
import { cn, SUBJECT_COLORS, PRIORITY_CONFIG, formatDeadline, autoPriority } from "@/lib/utils";
import { toast } from "sonner";
import SubjectHub from "@/components/SubjectHub";

const CATEGORIES = ["Lab", "Mini Project", "Viva", "Experiment", "Report"];

export default function PracticalsPage() {
  const { data: session } = useSession();
  const [practicals, setPracticals] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ subject: "", title: "", description: "", dueDate: "", category: "Lab", maxMarks: 25 });

  const userId = (session?.user as any)?.id;

  async function load() {
    setLoading(true);
    try {
      const [p, s, u] = await Promise.all([
        fetch("/api/practicals").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
      ]);
      setPracticals(Array.isArray(p) ? p : []);
      setSubjects(Array.isArray(s) ? s : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = form.subject || selectedSubject || "";
    if (!subject || !form.title || !form.dueDate) { toast.error("Fill required fields"); return; }
    try {
      if (editItem) {
        await fetch("/api/practicals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem._id, ...form, subject }) });
      } else {
        await fetch("/api/practicals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, subject }) });
        toast.success("Practical added 🧪");
      }
      closeForm(); load();
    } catch { toast.error("Failed to save"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete?")) return;
    await fetch(`/api/practicals?id=${id}`, { method: "DELETE" });
    toast.success("Deleted"); load();
  }

  async function toggleSubmission(practicalId: string, dueDate: string) {
    const isLate = new Date() > new Date(dueDate);
    await fetch("/api/practical-submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ practicalId, isLate }) });
    load();
  }

  function openEdit(p: any) {
    setEditItem(p);
    setForm({ subject: p.subject?._id ?? p.subject, title: p.title, description: p.description ?? "", dueDate: format(new Date(p.dueDate), "yyyy-MM-dd"), category: p.category, maxMarks: p.maxMarks });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditItem(null); }

  const countMap: Record<string, number> = {};
  practicals.forEach(p => {
    const sid = p.subject?._id ?? p.subject;
    countMap[sid] = (countMap[sid] || 0) + 1;
  });

  const currentSubject = subjects.find(s => s._id === selectedSubject);
  const subjectPracticals = selectedSubject ? practicals.filter(p => (p.subject?._id ?? p.subject) === selectedSubject) : [];

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedSubject && (
            <button onClick={() => setSelectedSubject(null)} className="p-2 glass rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              {selectedSubject ? currentSubject?.name : "Practicals"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedSubject ? `${subjectPracticals.length} practicals` : "Select a subject to view lab work"}
            </p>
          </div>
        </div>
        {selectedSubject && (
          <button onClick={() => { setForm({...form, subject: selectedSubject}); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Practical
          </button>
        )}
      </div>

      {!selectedSubject ? (
        <SubjectHub subjects={subjects} selected={null} onSelect={setSelectedSubject} countMap={countMap} countLabel="practicals" loading={loading} />
      ) : (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : subjectPracticals.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center border border-dashed border-border/50">
              <FlaskConical className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No practicals yet for this subject</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto flex items-center gap-2"><Plus className="w-4 h-4"/> Add Practical</button>
            </div>
          ) : (
            subjectPracticals.map(p => {
              const priority = autoPriority(p.dueDate);
              const pConf = PRIORITY_CONFIG[priority];
              const { label: dueLabel, urgent, overdue } = formatDeadline(p.dueDate);
              const mySubmission = p.submissions?.find((s: any) => (s.user?._id ?? s.user) === userId);
              const submitted = !!mySubmission;

              return (
                <div key={p._id} className={cn("glass rounded-xl border p-4 transition-all card-hover", overdue && !submitted ? "border-rose-500/30" : "border-border/50")}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className={cn("font-semibold text-sm", submitted && "line-through text-muted-foreground")}>{p.title}</p>
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Edit className="w-3.5 h-3.5"/></button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide", pConf.bg, pConf.color, pConf.border)}>{priority}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{p.category}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Max: {p.maxMarks}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full", overdue ? "bg-rose-500/10 text-rose-400" : urgent ? "bg-amber-500/10 text-amber-400" : "bg-secondary text-muted-foreground")}>{dueLabel}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {users.map((u: any) => {
                      const sub = p.submissions?.find((s: any) => (s.user?._id ?? s.user) === u._id);
                      return (
                        <div key={u._id} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", sub ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-secondary/50 text-muted-foreground border-border/30")}>
                          <div className={cn("w-3 h-3 rounded-full bg-gradient-to-br", u.gradient)} />
                          {u.name.split(" ")[0]}
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={() => toggleSubmission(p._id, p.dueDate)} className={cn("w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all", submitted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20")}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {submitted ? "Done — Click to undo" : "Mark as Completed"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-lg animate-fade-in">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">{editItem ? "Edit Practical" : "New Practical"}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Practical title" className="input-field" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="input-field" required />
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <input type="number" value={form.maxMarks} onChange={e => setForm({...form, maxMarks: +e.target.value})} placeholder="Max marks" className="input-field" min={1} />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description (optional)" className="input-field resize-none" rows={2} />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={closeForm} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
