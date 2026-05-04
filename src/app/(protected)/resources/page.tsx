"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Link as LinkIcon, Star, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", url: "", subject: "", type: "Document" });

  async function load() {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetch("/api/resources").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json())
      ]);
      setResources(Array.isArray(r) ? r : []);
      setSubjects(Array.isArray(s) ? s.filter((x:any) => !x.archived) : []);
    } catch { toast.error("Load failed"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowForm(false); setForm({ title: "", url: "", subject: "", type: "Document" }); load();
      toast.success("Added");
    } catch { toast.error("Error"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete?")) return;
    await fetch(`/api/resources?id=${id}`, { method: "DELETE" }); load();
  }

  const filtered = resources.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Study Resources</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/> Add Link</button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="input-field pl-9" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass p-6 rounded-2xl w-full max-w-md animate-fade-in">
            <h2 className="font-semibold mb-4">Add Resource Link</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title" className="input-field" required />
              <input type="url" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="URL (Google Drive, Notion, etc)" className="input-field" required />
              <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input-field" required>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
                <option>Document</option><option>Video</option><option>Notes</option><option>Past Paper</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => (
          <div key={r._id} className="glass p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-sm truncate pr-2">{r.title}</h3>
              <button onClick={() => handleDelete(r._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{r.subject?.name} • {r.type}</p>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-1.5"><LinkIcon className="w-3 h-3"/> Open Link</a>
          </div>
        ))}
      </div>
    </div>
  );
}
