"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Users, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function StudySessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", duration: 60, location: "", notes: "", attendees: [] as string[] });

  async function load() {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([ fetch("/api/study-sessions").then(r => r.json()), fetch("/api/users").then(r => r.json()) ]);
      setSessions(Array.isArray(s) ? s : []); setUsers(Array.isArray(u) ? u : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/study-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/study-sessions?id=${id}`, { method: "DELETE" }); load();
  }

  return (
    <div className="page-container space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Study Sessions</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/> Schedule</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass p-6 rounded-2xl w-full max-w-md">
            <h2 className="font-semibold mb-4">New Session</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Topic (e.g. OS Midterm Prep)" className="input-field" required />
              <input type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required />
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Location / Meet Link" className="input-field" />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map(s => (
          <div key={s._id} className="glass p-5 rounded-2xl border border-border/50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{s.title}</h3>
              <button onClick={() => handleDelete(s._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
            </div>
            <p className="text-xs flex items-center gap-2 text-muted-foreground mt-2"><Calendar className="w-3.5 h-3.5"/> {format(new Date(s.date), "MMM d, h:mm a")}</p>
            {s.location && <p className="text-xs mt-1 text-muted-foreground truncate">📍 {s.location}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
