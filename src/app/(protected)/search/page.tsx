"use client";

import { useState } from "react";
import { Search as SearchIcon, FileText, CheckSquare, Book } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ type: string; title: string; href: string }[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await Promise.all([
        fetch("/api/assignments").then(r => r.json()),
        fetch("/api/tasks").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json())
      ]);
      const [a, t, s] = res;
      const combined = [
        ...a.filter((x:any) => x.title.toLowerCase().includes(query.toLowerCase())).map((x:any) => ({ type: "Assignment", title: x.title, href: "/assignments" })),
        ...t.filter((x:any) => x.name.toLowerCase().includes(query.toLowerCase())).map((x:any) => ({ type: "Task", title: x.name, href: "/tasks" })),
        ...s.filter((x:any) => x.name.toLowerCase().includes(query.toLowerCase())).map((x:any) => ({ type: "Subject", title: x.name, href: "/subjects" }))
      ];
      setResults(combined);
    } catch {}
  }

  return (
    <div className="page-container max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Global Search</h1>
      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className="w-5 h-5 absolute left-3 top-3.5 text-muted-foreground" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search assignments, tasks, subjects..." className="input-field pl-10 py-3 text-lg rounded-xl" autoFocus />
      </form>
      
      <div className="space-y-2">
        {results.map((r, i) => (
          <Link key={i} href={r.href} className="flex items-center gap-3 p-4 glass rounded-xl hover:bg-secondary/50 transition-colors">
            {r.type === "Assignment" ? <FileText className="text-blue-400" /> : r.type === "Task" ? <CheckSquare className="text-emerald-400" /> : <Book className="text-violet-400" />}
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.type}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
