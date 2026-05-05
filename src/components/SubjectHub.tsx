"use client";

import { cn, SUBJECT_COLORS } from "@/lib/utils";
import { ChevronRight, BookOpen, Archive } from "lucide-react";

interface Subject {
  _id: string;
  name: string;
  code?: string;
  professor?: string;
  colorIndex?: number;
  archived?: boolean;
}

interface SubjectHubProps {
  subjects: Subject[];
  selected: string | null;
  onSelect: (id: string) => void;
  countMap?: Record<string, number>; // subjectId -> count of items
  countLabel?: string;
  loading?: boolean;
}

export default function SubjectHub({
  subjects,
  selected,
  onSelect,
  countMap = {},
  countLabel = "items",
  loading = false,
}: SubjectHubProps) {
  const active = subjects.filter((s) => !s.archived);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 border border-border/50 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {active.map((s) => {
        const color = SUBJECT_COLORS[(s.colorIndex ?? 0) % SUBJECT_COLORS.length];
        const isActive = selected === s._id;
        const count = countMap[s._id] ?? 0;

        return (
          <button
            key={s._id}
            onClick={() => onSelect(s._id)}
            className={cn(
              "relative overflow-hidden text-left rounded-2xl border transition-all duration-200 group",
              "flex flex-col justify-between p-5 min-h-[140px]",
              isActive
                ? `${color.light} ${color.border} border-2 shadow-lg`
                : "glass border-border/50 hover:border-border hover:shadow-md"
            )}
          >
            {/* Top color strip */}
            <div className={cn("absolute top-0 left-0 w-full h-1", color.bg)} />

            <div>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color.light)}>
                <BookOpen className={cn("w-4 h-4", color.text)} />
              </div>
              <p className="font-bold text-sm leading-tight text-foreground line-clamp-2">{s.name}</p>
              {s.professor && (
                <p className="text-[10px] text-muted-foreground mt-1 truncate">Prof. {s.professor}</p>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", color.light, color.text)}>
                {count} {countLabel}
              </span>
              <ChevronRight className={cn("w-4 h-4 transition-transform", color.text, isActive && "translate-x-0.5")} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
