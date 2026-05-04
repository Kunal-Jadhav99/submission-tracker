"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, CheckCircle2, Circle, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function SyllabusPage() {
  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [sy, su] = await Promise.all([ fetch("/api/syllabus").then(r => r.json()), fetch("/api/subjects").then(r => r.json()) ]);
      setSyllabus(Array.isArray(sy) ? sy : []); setSubjects(Array.isArray(su) ? su : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleTopic(id: string, tIndex: number, done: boolean) {
    const s = syllabus.find(x => x._id === id);
    if (!s) return;
    const newTopics = [...s.topics];
    newTopics[tIndex].completed = !done;
    await fetch("/api/syllabus", { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id, subject: s.subject._id, topics: newTopics }) });
    load();
  }

  return (
    <div className="page-container space-y-5">
      <h1 className="text-xl font-bold">Syllabus Coverage</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {syllabus.map(s => {
          const total = s.topics.length;
          const done = s.topics.filter((x:any) => x.completed).length;
          const progress = total ? (done / total) * 100 : 0;
          
          return (
            <div key={s._id} className="glass p-5 rounded-2xl border border-border/50">
              <h3 className="font-bold mb-2">{s.subject?.name}</h3>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Coverage</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5 mb-4" />
              <div className="space-y-2">
                {s.topics.map((t:any, i:number) => (
                  <div key={i} onClick={() => toggleTopic(s._id, i, t.completed)} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/30 cursor-pointer">
                    {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                    <span className={cn("text-sm", t.completed && "text-muted-foreground line-through")}>{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
