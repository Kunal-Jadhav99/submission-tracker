"use client";

import { useEffect, useState } from "react";
import { format, getDay } from "date-fns";
import { Plus, Trash2, Settings, CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";
import { cn, SUBJECT_COLORS, getAttendanceStatus } from "@/lib/utils";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const WORK_DAYS = [1, 2, 3, 4, 5]; // Mon–fri
const PERIODS = [1, 2, 3, 4, 5, 6];

type TimetableEntry = {
  _id: string;
  dayOfWeek: number;
  period: number;
  subject: { _id: string; name: string; colorIndex?: number } | null;
  startTime?: string;
  endTime?: string;
};

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"today" | "overview" | "timetable">("today");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Timetable editor state
  const [editCell, setEditCell] = useState<{ day: number; period: number } | null>(null);
  const [editSubject, setEditSubject] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [r, s, u, t] = await Promise.all([
        fetch("/api/attendance").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
        fetch("/api/timetable").then(r => r.json()),
      ]);
      setRecords(Array.isArray(r) ? r : []);
      setSubjects(Array.isArray(s) ? s.filter((x: any) => !x.archived) : []);
      setUsers(Array.isArray(u) ? u : []);
      setTimetable(Array.isArray(t) ? t : []);
    } catch { toast.error("Load failed"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markAttendance(uId: string, subjectId: string, status: "Present" | "Absent") {
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: uId, subjectId, date: selectedDate, status }),
    });
    toast.success(`Marked ${status}`);
    load();
  }

  async function saveTimetableCell(day: number, period: number, subjectId: string) {
    if (!subjectId) return;
    await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek: day, period, subject: subjectId }),
    });
    setEditCell(null);
    load();
  }

  async function deleteTimetableCell(id: string) {
    await fetch(`/api/timetable?id=${id}`, { method: "DELETE" });
    load();
  }

  // Get classes scheduled for selected date
  const dayOfWeek = getDay(new Date(selectedDate + "T00:00:00"));
  const todayClasses = timetable
    .filter(t => t.dayOfWeek === dayOfWeek && t.subject)
    .sort((a, b) => a.period - b.period);

  const getRecord = (uId: string, subjectId: string, date: string) =>
    records.find(r => (r.user?._id ?? r.user) === uId && (r.subject?._id ?? r.subject) === subjectId && format(new Date(r.date), "yyyy-MM-dd") === date);

  const getSubjectStats = (subjectId: string, uId: string) => {
    const subRecs = records.filter(r => (r.subject?._id ?? r.subject) === subjectId && (r.user?._id ?? r.user) === uId);
    const present = subRecs.filter(r => r.status === "Present").length;
    const total = subRecs.length;
    const pct = total ? Math.round((present / total) * 100) : 100;
    return { present, total, pct };
  };

  return (
    <div className="page-container space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Attendance</h1>
        <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
          {(["today", "overview", "timetable"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors", tab === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>{t === "today" ? "📅 Mark" : t === "overview" ? "📊 Overview" : "🗓️ Timetable"}</button>
          ))}
        </div>
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : (

        <>
          {/* ── TAB: MARK ATTENDANCE ── */}
          {tab === "today" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-field max-w-xs" />
                <p className="text-sm text-muted-foreground">{DAYS[dayOfWeek]} · {todayClasses.length} classes scheduled</p>
              </div>

              {todayClasses.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-dashed border-border/50">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No classes scheduled for this day</p>
                  <p className="text-xs text-muted-foreground mt-1">Set up your timetable in the Timetable tab first</p>
                </div>
              ) : (
                todayClasses.map(entry => {
                  const color = SUBJECT_COLORS[(entry.subject?.colorIndex ?? 0) % SUBJECT_COLORS.length];
                  return (
                    <div key={entry._id} className="glass rounded-2xl border border-border/50 overflow-hidden">
                      <div className={cn("flex items-center gap-3 px-5 py-3 border-b border-border/50", color.light)}>
                        <div className={cn("w-1.5 h-6 rounded-full", color.bg)} />
                        <div>
                          <p className="font-bold text-sm">{entry.subject?.name}</p>
                          <p className="text-xs text-muted-foreground">Period {entry.period}</p>
                        </div>
                      </div>

                      <div className="p-4 grid md:grid-cols-3 gap-3">
                        {users.map(u => {
                          const rec = getRecord(u._id, entry.subject!._id, selectedDate);
                          const status = rec?.status;
                          return (
                            <div key={u._id} className="flex items-center justify-between bg-secondary/30 rounded-xl p-3">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br", u.gradient)}>
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{u.name.split(" ")[0]}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => markAttendance(u._id, entry.subject!._id, "Present")}
                                  className={cn("p-2 rounded-lg transition-all text-xs font-bold", status === "Present" ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20")}
                                  title="Present"
                                >P</button>
                                <button
                                  onClick={() => markAttendance(u._id, entry.subject!._id, "Absent")}
                                  className={cn("p-2 rounded-lg transition-all text-xs font-bold", status === "Absent" ? "bg-rose-500 text-white" : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20")}
                                  title="Absent"
                                >A</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB: OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-4">
              {subjects.map(sub => {
                const color = SUBJECT_COLORS[(sub.colorIndex ?? 0) % SUBJECT_COLORS.length];
                return (
                  <div key={sub._id} className="glass rounded-2xl border border-border/50 overflow-hidden">
                    <div className={cn("flex items-center gap-3 px-5 py-3 border-b border-border/50", color.light)}>
                      <div className={cn("w-1.5 h-6 rounded-full", color.bg)} />
                      <p className="font-bold text-sm">{sub.name}</p>
                    </div>
                    <div className="p-4 grid md:grid-cols-3 gap-4">
                      {users.map(u => {
                        const { present, total, pct } = getSubjectStats(sub._id, u._id);
                        const status = getAttendanceStatus(pct);
                        const needed = pct < 75 && total > 0 ? Math.ceil((0.75 * total - present) / 0.25) : 0;
                        return (
                          <div key={u._id} className="bg-secondary/30 rounded-xl p-3 text-center">
                            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-2 bg-gradient-to-br", u.gradient)}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-xs font-semibold mb-1">{u.name.split(" ")[0]}</p>
                            <p className={cn("text-2xl font-black", status.color)}>{pct}%</p>
                            <p className="text-[10px] text-muted-foreground">{present}/{total} classes</p>
                            {needed > 0 && <p className="text-[10px] text-rose-400 mt-1 font-semibold">Need {needed} more</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB: TIMETABLE EDITOR ── */}
          {tab === "timetable" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Click any cell to set the subject for that period. This timetable drives the Mark Attendance tab.</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-xs text-muted-foreground font-semibold text-left">Period</th>
                      {WORK_DAYS.map(d => (
                        <th key={d} className="p-2 text-xs text-muted-foreground font-semibold text-center">{DAYS_SHORT[d]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map(period => (
                      <tr key={period}>
                        <td className="p-2 text-xs text-muted-foreground font-mono">{period}</td>
                        {WORK_DAYS.map(day => {
                          const entry = timetable.find(t => t.dayOfWeek === day && t.period === period);
                          const subject = entry?.subject;
                          const color = subject ? SUBJECT_COLORS[(subject.colorIndex ?? 0) % SUBJECT_COLORS.length] : null;
                          const isEditing = editCell?.day === day && editCell?.period === period;

                          return (
                            <td key={day} className="p-1">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <select
                                    defaultValue={entry?.subject?._id ?? ""}
                                    onChange={e => setEditSubject(e.target.value)}
                                    className="input-field py-1 text-xs w-full"
                                    autoFocus
                                  >
                                    <option value="">— free —</option>
                                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                  </select>
                                  <button
                                    onClick={async () => {
                                      if (editSubject) await saveTimetableCell(day, period, editSubject);
                                      else if (entry) await deleteTimetableCell(entry._id);
                                      setEditCell(null);
                                    }}
                                    className="px-2 py-1 bg-primary text-white rounded text-xs"
                                  >✓</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditCell({ day, period }); setEditSubject(subject?._id ?? ""); }}
                                  className={cn("w-full min-h-[36px] p-1.5 rounded-lg text-xs transition-all text-center", subject ? `${color!.light} ${color!.text} font-medium` : "hover:bg-secondary/50 text-muted-foreground border border-dashed border-border/30")}
                                >
                                  {subject ? subject.name.split(" ")[0] : "+"}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
