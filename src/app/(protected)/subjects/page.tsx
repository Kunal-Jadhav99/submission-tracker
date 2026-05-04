"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, X, Loader2, Archive } from "lucide-react";
import { cn, SUBJECT_COLORS } from "@/lib/utils";
import { toast } from "sonner";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", credits: 3, professor: "", colorIndex: 0, archived: false });

  async function load() {
    setLoading(true);
    try {
      const s = await fetch("/api/subjects").then(r => r.json());
      setSubjects(Array.isArray(s) ? s : []);
    } catch { toast.error("Failed to load"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editItem) await fetch("/api/subjects", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editItem._id, ...form }) });
      else await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowForm(false); setEditItem(null); load();
      toast.success("Subject saved");
    } catch { toast.error("Error saving"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete?")) return;
    await fetch(`/api/subjects?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="page-container space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Subjects</h1>
        <button onClick={() => { setEditItem(null); setForm({ name: "", code: "", credits: 3, professor: "", colorIndex: 0, archived: false }); setShowForm(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/> Add Subject</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass p-6 rounded-2xl w-full max-w-md animate-fade-in">
            <h2 className="font-semibold mb-4">{editItem ? "Edit" : "New"} Subject</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Subject Name (e.g. Data Structures)" className="input-field" required />
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="Course Code (e.g. CS201)" className="input-field" />
              <input value={form.professor} onChange={e => setForm({...form, professor: e.target.value})} placeholder="Professor" className="input-field" />
              <input type="number" value={form.credits} onChange={e => setForm({...form, credits: parseInt(e.target.value)})} className="input-field" min="1" max="6" />
              
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Color Theme</label>
                <div className="flex gap-2 flex-wrap">
                  {SUBJECT_COLORS.map((c, i) => (
                    <button type="button" key={i} onClick={() => setForm({...form, colorIndex: i})} className={cn("w-6 h-6 rounded-full transition-all", c.bg, form.colorIndex === i ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-50 hover:opacity-100")} />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" checked={form.archived} onChange={e => setForm({...form, archived: e.target.checked})} id="archived" className="rounded bg-secondary border-border" />
                <label htmlFor="archived" className="text-sm text-muted-foreground">Archive Subject</label>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : (
        <div className="grid gap-4 md:grid-cols-3">
          {subjects.map(s => {
            const color = SUBJECT_COLORS[(s.colorIndex ?? 0) % SUBJECT_COLORS.length];
            return (
              <div key={s._id} className={cn("glass rounded-xl border border-border/50 flex flex-col overflow-hidden transition-all", s.archived && "opacity-60 grayscale")}>
                <div className={cn("h-1.5 w-full", color.bg)} />
                <div className="p-4 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{s.name}</h3>
                      <span className="text-xs text-muted-foreground font-mono">{s.code} • {s.credits} Credits</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(s); setForm({...s}); setShowForm(true); }} className="text-muted-foreground hover:text-foreground"><Edit className="w-3.5 h-3.5"/></button>
                      <button onClick={() => handleDelete(s._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Prof. {s.professor}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
