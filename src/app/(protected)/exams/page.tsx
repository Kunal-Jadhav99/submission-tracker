"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Plus, Trash2, Trophy, X, Loader2, ArrowLeft, GraduationCap } from "lucide-react";
import { cn, SUBJECT_COLORS, autoPriority, formatDeadline } from "@/lib/utils";
import { toast } from "sonner";
import SubjectHub from "@/components/SubjectHub";

const EXAM_TYPES = ["IA1", "IA2", "Semester"] as const;
type ExamType = typeof EXAM_TYPES[number];

const TYPE_CONFIG: Record<ExamType, { label: string; color: string; bg: string; border: string }> = {
  IA1:      { label: "Internal Assessment 1", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  IA2:      { label: "Internal Assessment 2", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30"   },
  Semester: { label: "Semester Exam",         color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30"  },
};

export default function ExamsPage() {
  const { data: session } = useSession();
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ExamType>("IA1");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ subject: "", name: "", examType: "IA1", date: "", totalMarks: 100 });
  const [markInputs, setMarkInputs] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const [e, s, u] = await Promise.all([
        fetch("/api/exams").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
      ]);
      setExams(Array.isArray(e) ? e : []);
      setSubjects(Array.isArray(s) ? s.filter((x: any) => !x.archived) : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch { toast.error("Load failed"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subjectId = form.subject || selectedSubject || "";
    if (!subjectId || !form.name || !form.date) { toast.error("Fill required fields"); return; }
    try {
      if (editItem) {
        await fetch("/api/exams", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem._id, ...form, subject: subjectId }) });
      } else {
        await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, subject: subjectId }) });
        toast.success("Exam added ✅");
      }
      setShowForm(false); setEditItem(null); setForm({ subject: "", name: "", examType: "IA1", date: "", totalMarks: 100 }); load();
    } catch { toast.error("Error saving"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete exam?")) return;
    await fetch(`/api/exams?id=${id}`, { method: "DELETE" });
    toast.success("Deleted"); load();
  }

  async function handleMarkSubmit(examId: string, uId: string) {
    const score = parseInt(markInputs[`${examId}_${uId}`]);
    if (isNaN(score)) return;
    await fetch("/api/marks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId, targetUserId: uId, score }) });
    toast.success("Marks saved ✅");
    load();
  }

  // Build count map for SubjectHub
  const countMap: Record<string, number> = {};
  exams.forEach(ex => {
    const sid = ex.subject?._id ?? ex.subject;
    countMap[sid] = (countMap[sid] || 0) + 1;
  });

  const currentSubject = subjects.find(s => s._id === selectedSubject);
  const subjectColor = currentSubject ? SUBJECT_COLORS[(currentSubject.colorIndex ?? 0) % SUBJECT_COLORS.length] : null;

  const subjectExams = selectedSubject
    ? exams.filter(ex => (ex.subject?._id ?? ex.subject) === selectedSubject)
    : [];

  const tabExams = subjectExams.filter(ex => ex.examType === activeTab);

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
            <h1 className="text-xl font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {selectedSubject ? currentSubject?.name : "Exams & Marks"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedSubject
                ? `${subjectExams.length} exams · Prof. ${currentSubject?.professor ?? "—"}`
                : "Select a subject to view its exams"}
            </p>
          </div>
        </div>
        {selectedSubject && (
          <button
            onClick={() => { setEditItem(null); setForm({ subject: selectedSubject, name: "", examType: "IA1", date: "", totalMarks: 100 }); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Exam
          </button>
        )}
      </div>

      {/* Subject Card Grid or Exam Detail */}
      {!selectedSubject ? (
        <SubjectHub
          subjects={subjects}
          selected={null}
          onSelect={setSelectedSubject}
          countMap={countMap}
          countLabel="exams"
          loading={loading}
        />
      ) : (
        <div className="space-y-4">
          {/* IA1 / IA2 / Semester tabs */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-1 w-fit">
            {EXAM_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  activeTab === t
                    ? `${TYPE_CONFIG[t].bg} ${TYPE_CONFIG[t].color} ${TYPE_CONFIG[t].border} border`
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">{TYPE_CONFIG[activeTab].label}</p>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : tabExams.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center border border-dashed border-border/50">
              <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No {activeTab} exams for this subject</p>
              <button
                onClick={() => { setForm({ subject: selectedSubject, name: "", examType: activeTab, date: "", totalMarks: activeTab === "Semester" ? 100 : 30 }); setShowForm(true); }}
                className="btn-primary mt-4 mx-auto flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add {activeTab} Exam
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tabExams.map(exam => {
                const color = subjectColor!;
                const typeConf = TYPE_CONFIG[exam.examType as ExamType] ?? TYPE_CONFIG.IA1;
                return (
                  <div key={exam._id} className="glass p-5 rounded-2xl border border-border/50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-10 rounded-full", color.bg)} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-base">{exam.name}</h3>
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase", typeConf.bg, typeConf.color, typeConf.border)}>
                              {exam.examType}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(exam.date), "MMM d, yyyy")} · Max: {exam.totalMarks}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(exam._id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Marks entry */}
                    <div className="grid md:grid-cols-3 gap-3">
                      {users.map(u => {
                        const mark = exam.marks?.find((m: any) => (m.user?._id ?? m.user) === u._id);
                        const score = mark?.score;
                        const inputKey = `${exam._id}_${u._id}`;
                        const pct = score !== undefined ? Math.round((score / exam.totalMarks) * 100) : null;
                        return (
                          <div key={u._id} className="flex flex-col bg-secondary/30 p-3 rounded-xl border border-border/30">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br", u.gradient)}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-sm font-semibold">{u.name}</span>
                                {pct !== null && (
                                  <span className={cn("ml-2 text-xs font-bold", pct >= 75 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400")}>
                                    {score}/{exam.totalMarks} ({pct}%)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="number" min="0" max={exam.totalMarks}
                                placeholder={score !== undefined ? String(score) : "Enter marks"}
                                value={markInputs[inputKey] ?? ""}
                                onChange={e => setMarkInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                                className="input-field py-1 text-sm flex-1"
                              />
                              <button
                                onClick={() => handleMarkSubmit(exam._id, u._id)}
                                className="px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                              >
                                Save
                              </button>
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
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass p-6 rounded-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editItem ? "Edit" : "New"} Exam</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Exam Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Unit Test 1" className="input-field" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Exam Type *</label>
                <div className="flex gap-2">
                  {EXAM_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, examType: t })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold border transition-all",
                        form.examType === t
                          ? `${TYPE_CONFIG[t].bg} ${TYPE_CONFIG[t].color} ${TYPE_CONFIG[t].border}`
                          : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Total Marks</label>
                  <input type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: parseInt(e.target.value) })} className="input-field" min={1} required />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
