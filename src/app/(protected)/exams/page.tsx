"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Trophy, X, Loader2 } from "lucide-react";
import { cn, SUBJECT_COLORS } from "@/lib/utils";
import { toast } from "sonner";

export default function ExamsPage() {
  const { data: session } = useSession();
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ subject: "", name: "", date: "", totalMarks: 100 });
  const [markInputs, setMarkInputs] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const [e, s, u] = await Promise.all([
        fetch("/api/exams").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
        fetch("/api/users").then(r => r.json())
      ]);
      setExams(Array.isArray(e) ? e : []);
      setSubjects(Array.isArray(s) ? s.filter((x:any) => !x.archived) : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch { toast.error("Load failed"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editItem) await fetch("/api/exams", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem._id, ...form }) });
      else await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowForm(false); setEditItem(null); setForm({ subject: "", name: "", date: "", totalMarks: 100 }); load();
    } catch { toast.error("Error saving"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete exam?")) return;
    await fetch(`/api/exams?id=${id}`, { method: "DELETE" });
    load();
  }

  async function handleMarkSubmit(examId: string, uId: string) {
    const score = parseInt(markInputs[`${examId}_${uId}`]);
    if (isNaN(score)) return;
    await fetch("/api/marks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId, targetUserId: uId, score }) });
    toast.success("Marks saved");
    load();
  }

  return (
    <div className="page-container space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Exams & Marks</h1>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/> Add Exam</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass p-6 rounded-2xl w-full max-w-md animate-fade-in">
            <h2 className="font-semibold mb-4">{editItem ? "Edit" : "New"} Exam</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Exam Name (e.g. Midterm 1)" className="input-field" required />
              <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input-field" required>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required />
              <input type="number" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: parseInt(e.target.value)})} placeholder="Total Marks" className="input-field" required />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : (
        <div className="space-y-6">
          {exams.map(exam => {
            const color = SUBJECT_COLORS[(exam.subject?.colorIndex ?? 0) % SUBJECT_COLORS.length];
            return (
              <div key={exam._id} className="glass p-5 rounded-2xl border border-border/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-10 rounded-full", color.bg)} />
                    <div>
                      <h3 className="font-bold text-lg">{exam.name}</h3>
                      <p className="text-sm text-muted-foreground">{exam.subject?.name} • {format(new Date(exam.date), "MMM d, yyyy")} • Max: {exam.totalMarks}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(exam._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {users.map(u => {
                    const mark = exam.marks?.find((m: any) => (m.user?._id ?? m.user) === u._id);
                    const score = mark?.score;
                    const inputKey = `${exam._id}_${u._id}`;
                    return (
                      <div key={u._id} className="flex flex-col bg-secondary/30 p-3 rounded-xl border border-border/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-4 h-4 rounded-full", `bg-gradient-to-br ${u.gradient}`)} />
                          <span className="text-sm font-semibold">{u.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="number" min="0" max={exam.totalMarks}
                            placeholder={score !== undefined ? String(score) : "Enter marks"}
                            value={markInputs[inputKey] ?? ""}
                            onChange={e => setMarkInputs(prev => ({...prev, [inputKey]: e.target.value}))}
                            className="input-field py-1 text-sm flex-1"
                          />
                          <button onClick={() => handleMarkSubmit(exam._id, u._id)} className="px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20">Save</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
