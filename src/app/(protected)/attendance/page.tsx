"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Settings, CheckCircle2, XCircle, Loader2, Calendar, ArrowLeft, Users, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { cn, SUBJECT_COLORS, getAttendanceStatus } from "@/lib/utils";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WORK_DAYS = [1, 2, 3, 4, 5];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

type TimetableEntry = {
  _id: string;
  dayOfWeek: number;
  period: number;
  subject: { _id: string; name: string; colorIndex?: number } | null;
  startTime?: string;
  endTime?: string;
};

export default function AttendancePage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"mark" | "overview" | "timetable" | "calendar">("mark");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [calMonth, setCalMonth] = useState(new Date());

  // Timetable editor state
  const [editCell, setEditCell] = useState<{ day: number; period: number } | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [r, s, t] = await Promise.all([
        fetch("/api/attendance").then(r => r.json()),
        fetch("/api/subjects").then(r => r.json()),
        fetch("/api/timetable").then(r => r.json()),
      ]);
      setRecords(Array.isArray(r) ? r : []);
      setSubjects(Array.isArray(s) ? s.filter((x: any) => !x.archived) : []);
      setTimetable(Array.isArray(t) ? t : []);
    } catch { toast.error("Load failed"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markAttendance(subjectId: string, status: "Present" | "Absent") {
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, date: selectedDate, status }),
    });
    toast.success(`Marked ${status}`);
    load();
  }

  async function saveTimetableCell(day: number, period: number, subjectId: string) {
    if (!subjectId) {
      // Delete entry if exists
      const entry = timetable.find(t => t.dayOfWeek === day && t.period === period);
      if (entry) {
        await fetch(`/api/timetable?id=${entry._id}`, { method: "DELETE" });
        setEditCell(null); load();
      } else {
        setEditCell(null);
      }
      return;
    }
    await fetch("/api/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek: day, period, subject: subjectId, startTime: editStart, endTime: editEnd }),
    });
    setEditCell(null); load();
  }

  // Today's classes from timetable
  const dayOfWeek = getDay(new Date(selectedDate + "T00:00:00"));
  const todayClasses = timetable
    .filter(t => t.dayOfWeek === dayOfWeek && t.subject)
    .sort((a, b) => a.period - b.period);

  const getRecord = (subjectId: string, date: string) =>
    records.find(r => (r.subject?._id ?? r.subject) === subjectId && format(new Date(r.date), "yyyy-MM-dd") === date);

  const getSubjectStats = (subjectId: string) => {
    const subRecs = records.filter(r => (r.subject?._id ?? r.subject) === subjectId);
    const present = subRecs.filter(r => r.status === "Present").length;
    const total = subRecs.length;
    const pct = total ? Math.round((present / total) * 100) : 100;
    return { present, total, pct, records: subRecs };
  };

  // Calendar: days in current month
  const calDays = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) });

  const getDayAttendanceSummary = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayRecs = records.filter(r => format(new Date(r.date), "yyyy-MM-dd") === dateStr);
    if (dayRecs.length === 0) return null;
    const allPresent = dayRecs.every(r => r.status === "Present");
    const allAbsent = dayRecs.every(r => r.status === "Absent");
    if (allPresent) return "present";
    if (allAbsent) return "absent";
    return "mixed";
  };

  return (
    <div className="page-container space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Attendance
          </h1>
          <p className="text-xs text-muted-foreground">Track your personal attendance</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary rounded-xl p-1">
          {([
            { id: "mark", label: "📅 Mark" },
            { id: "overview", label: "📊 Overview" },
            { id: "calendar", label: "🗓️ Calendar" },
            { id: "timetable", label: "⚙️ Timetable" },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === id ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : (
        <>
          {/* ── TAB: MARK ATTENDANCE ── */}
          {tab === "mark" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="input-field max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  {DAYS[dayOfWeek]} · {todayClasses.length} classes scheduled
                </p>
              </div>

              {todayClasses.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-dashed border-border/50">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No classes scheduled for {DAYS[dayOfWeek]}</p>
                  <p className="text-xs text-muted-foreground mt-1">Set up your timetable in the ⚙️ Timetable tab first</p>
                  <button onClick={() => setTab("timetable")} className="btn-primary mt-4 mx-auto flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Set Up Timetable
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map(entry => {
                    const color = SUBJECT_COLORS[(entry.subject?.colorIndex ?? 0) % SUBJECT_COLORS.length];
                    const rec = getRecord(entry.subject!._id, selectedDate);
                    const status = rec?.status;
                    const stats = getSubjectStats(entry.subject!._id);

                    return (
                      <div key={entry._id} className="glass rounded-2xl border border-border/50 overflow-hidden">
                        <div className={cn("flex items-center justify-between px-5 py-3 border-b border-border/50", color.light)}>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-1.5 h-6 rounded-full", color.bg)} />
                            <div>
                              <p className="font-bold text-sm">{entry.subject?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Period {entry.period}
                                {entry.startTime && ` · ${entry.startTime}${entry.endTime ? ` – ${entry.endTime}` : ""}`}
                              </p>
                            </div>
                          </div>
                          {/* Running stats */}
                          <div className="text-right">
                            <p className={cn("text-lg font-black", getAttendanceStatus(stats.pct).color)}>{stats.pct}%</p>
                            <p className="text-[10px] text-muted-foreground">{stats.present}/{stats.total} classes</p>
                          </div>
                        </div>

                        <div className="p-4 flex items-center gap-3">
                          <p className="text-sm text-muted-foreground flex-1">
                            {status ? (
                              <span className={cn("font-semibold", status === "Present" ? "text-emerald-400" : "text-rose-400")}>
                                Already marked: {status}
                              </span>
                            ) : "Mark your attendance:"}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => markAttendance(entry.subject!._id, "Present")}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                status === "Present"
                                  ? "bg-emerald-500 text-white border-emerald-500"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              )}
                            >
                              ✓ Present
                            </button>
                            <button
                              onClick={() => markAttendance(entry.subject!._id, "Absent")}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                status === "Absent"
                                  ? "bg-rose-500 text-white border-rose-500"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                              )}
                            >
                              ✗ Absent
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-4">
              {subjects.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-dashed border-border/50">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No subjects found. Add subjects first.</p>
                </div>
              ) : (
                subjects.map(sub => {
                  const color = SUBJECT_COLORS[(sub.colorIndex ?? 0) % SUBJECT_COLORS.length];
                  const { present, total, pct } = getSubjectStats(sub._id);
                  const status = getAttendanceStatus(pct);
                  const needed = pct < 75 && total > 0 ? Math.ceil((0.75 * total - present) / 0.25) : 0;
                  const canSkip = pct > 75 && total > 0 ? Math.floor((present - 0.75 * total) / 0.75) : 0;

                  return (
                    <div key={sub._id} className="glass rounded-2xl border border-border/50 overflow-hidden">
                      <div className={cn("flex items-center gap-3 px-5 py-3 border-b border-border/50", color.light)}>
                        <div className={cn("w-1.5 h-6 rounded-full", color.bg)} />
                        <p className="font-bold text-sm flex-1">{sub.name}</p>
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", color.light, color.text)}>{sub.professor ? `Prof. ${sub.professor}` : ""}</span>
                      </div>
                      <div className="p-4 flex items-center gap-6">
                        <div className="text-center">
                          <p className={cn("text-3xl font-black", status.color)}>{pct}%</p>
                          <p className="text-[10px] text-muted-foreground">{present}/{total} classes</p>
                        </div>
                        {/* Progress bar */}
                        <div className="flex-1">
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", pct >= 75 ? "bg-emerald-500" : pct >= 65 ? "bg-amber-500" : "bg-rose-500")}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>0%</span><span className="text-amber-400">75% min</span><span>100%</span>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <span className={cn("font-bold", status.color)}>{status.label}</span>
                          {needed > 0 && <p className="text-rose-400 mt-1">Need {needed} more classes</p>}
                          {canSkip > 0 && <p className="text-emerald-400 mt-1">Can skip {canSkip} classes</p>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB: CALENDAR ── */}
          {tab === "calendar" && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-5 border border-border/50">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-2 hover:bg-secondary rounded-lg">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="font-bold">{format(calMonth, "MMMM yyyy")}</h2>
                  <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-2 hover:bg-secondary rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_SHORT.map(d => <div key={d} className="text-center text-[10px] text-muted-foreground font-semibold py-1">{d}</div>)}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Leading blank cells */}
                  {Array.from({ length: getDay(startOfMonth(calMonth)) }).map((_, i) => <div key={`blank-${i}`} />)}
                  {calDays.map(day => {
                    const summary = getDayAttendanceSummary(day);
                    const isToday = isSameDay(day, new Date());
                    const isSelected = format(day, "yyyy-MM-dd") === selectedDate;
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => { setSelectedDate(format(day, "yyyy-MM-dd")); setTab("mark"); }}
                        className={cn(
                          "aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all relative",
                          isSelected ? "ring-2 ring-primary" : "",
                          isToday ? "font-black" : "",
                          summary === "present" ? "bg-emerald-500/20 text-emerald-400" :
                          summary === "absent"  ? "bg-rose-500/20 text-rose-400" :
                          summary === "mixed"   ? "bg-amber-500/20 text-amber-400" :
                          "hover:bg-secondary/50 text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                        {isToday && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500/60" /> Present</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-rose-500/60" /> Absent</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500/60" /> Mixed</span>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: TIMETABLE EDITOR ── */}
          {tab === "timetable" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set up your personal weekly timetable. This drives the Mark tab — only your scheduled classes show up for marking.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-xs text-muted-foreground font-semibold text-left w-12">Period</th>
                      {WORK_DAYS.map(d => (
                        <th key={d} className="p-2 text-xs text-muted-foreground font-semibold text-center">{DAYS_SHORT[d]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map(period => (
                      <tr key={period} className="border-t border-border/20">
                        <td className="p-2 text-xs text-muted-foreground font-mono">{period}</td>
                        {WORK_DAYS.map(day => {
                          const entry = timetable.find(t => t.dayOfWeek === day && t.period === period);
                          const subject = entry?.subject;
                          const color = subject ? SUBJECT_COLORS[(subject.colorIndex ?? 0) % SUBJECT_COLORS.length] : null;
                          const isEditing = editCell?.day === day && editCell?.period === period;

                          return (
                            <td key={day} className="p-1">
                              {isEditing ? (
                                <div className="space-y-1">
                                  <select
                                    defaultValue={entry?.subject?._id ?? ""}
                                    onChange={e => setEditSubject(e.target.value)}
                                    className="input-field py-1 text-xs w-full"
                                    autoFocus
                                  >
                                    <option value="">— free —</option>
                                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                  </select>
                                  <div className="flex gap-1">
                                    <input type="time" defaultValue={entry?.startTime ?? ""} onChange={e => setEditStart(e.target.value)} className="input-field py-0.5 text-xs flex-1" placeholder="Start" />
                                    <input type="time" defaultValue={entry?.endTime ?? ""} onChange={e => setEditEnd(e.target.value)} className="input-field py-0.5 text-xs flex-1" placeholder="End" />
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => saveTimetableCell(day, period, editSubject)}
                                      className="flex-1 py-1 bg-primary text-white rounded text-xs"
                                    >✓ Save</button>
                                    <button onClick={() => setEditCell(null)} className="flex-1 py-1 bg-secondary text-muted-foreground rounded text-xs">✕</button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditCell({ day, period });
                                    setEditSubject(subject?._id ?? "");
                                    setEditStart(entry?.startTime ?? "");
                                    setEditEnd(entry?.endTime ?? "");
                                  }}
                                  className={cn(
                                    "w-full min-h-[40px] p-1.5 rounded-lg text-xs transition-all text-center",
                                    subject
                                      ? `${color!.light} ${color!.text} font-medium border ${color!.border}`
                                      : "hover:bg-secondary/50 text-muted-foreground border border-dashed border-border/30"
                                  )}
                                >
                                  {subject ? (
                                    <div>
                                      <p>{subject.name.split(" ")[0]}</p>
                                      {entry?.startTime && <p className="text-[9px] opacity-70">{entry.startTime}</p>}
                                    </div>
                                  ) : "+"}
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
