"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [a, e, s] = await Promise.all([
          fetch("/api/assignments").then(r => r.json()),
          fetch("/api/exams").then(r => r.json()),
          fetch("/api/study-sessions").then(r => r.json())
        ]);
        const all = [
          ...a.map((x:any) => ({ date: new Date(x.dueDate), title: x.title, type: "Assignment", color: "bg-emerald-500" })),
          ...e.map((x:any) => ({ date: new Date(x.date), title: x.name, type: "Exam", color: "bg-rose-500" })),
          ...s.map((x:any) => ({ date: new Date(x.date), title: x.title, type: "Session", color: "bg-blue-500" }))
        ];
        setEvents(all);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });

  return (
    <div className="page-container h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">{format(currentDate, "MMMM yyyy")}</h1>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 glass rounded-lg"><ChevronLeft className="w-4 h-4"/></button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 glass rounded-lg"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="flex-1 glass rounded-2xl border border-border/50 overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-border/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((d, i) => {
            const dayEvents = events.filter(e => isSameDay(e.date, d));
            return (
              <div key={i} className={cn("border-r border-b border-border/50 p-1 md:p-2 flex flex-col min-h-[80px]", !isSameMonth(d, currentDate) && "opacity-30 bg-secondary/20")}>
                <span className={cn("text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday(d) && "bg-primary text-white font-bold")}>{format(d, "d")}</span>
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                  {dayEvents.map((e, j) => (
                    <div key={j} className={cn("text-[10px] px-1.5 py-0.5 rounded text-white truncate", e.color)} title={e.title}>{e.title}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
