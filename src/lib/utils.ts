import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SUBJECT_COLORS = [
  { bg: "bg-violet-500", text: "text-violet-500", light: "bg-violet-500/10", border: "border-violet-500/30", hex: "#8B5CF6" },
  { bg: "bg-blue-500", text: "text-blue-500", light: "bg-blue-500/10", border: "border-blue-500/30", hex: "#3B82F6" },
  { bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-500/10", border: "border-emerald-500/30", hex: "#10B981" },
  { bg: "bg-rose-500", text: "text-rose-500", light: "bg-rose-500/10", border: "border-rose-500/30", hex: "#F43F5E" },
  { bg: "bg-amber-500", text: "text-amber-500", light: "bg-amber-500/10", border: "border-amber-500/30", hex: "#F59E0B" },
  { bg: "bg-cyan-500", text: "text-cyan-500", light: "bg-cyan-500/10", border: "border-cyan-500/30", hex: "#06B6D4" },
  { bg: "bg-fuchsia-500", text: "text-fuchsia-500", light: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", hex: "#D946EF" },
  { bg: "bg-indigo-500", text: "text-indigo-500", light: "bg-indigo-500/10", border: "border-indigo-500/30", hex: "#6366F1" },
  { bg: "bg-orange-500", text: "text-orange-500", light: "bg-orange-500/10", border: "border-orange-500/30", hex: "#F97316" },
  { bg: "bg-teal-500", text: "text-teal-500", light: "bg-teal-500/10", border: "border-teal-500/30", hex: "#14B8A6" },
];

export const PRIORITY_CONFIG = {
  Critical: { color: "text-rose-300", bg: "bg-rose-600/20", border: "border-rose-500/50", dot: "bg-rose-300" },
  High: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", dot: "bg-rose-400" },
  Medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" },
  Low: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
};

/** Auto-calculates priority based on days remaining until dueDate */
export function autoPriority(dueDate: Date | string): keyof typeof PRIORITY_CONFIG {
  const days = getDaysUntil(dueDate);
  if (days < 0) return "Critical";
  if (days <= 2) return "High";
  if (days <= 6) return "Medium";
  return "Low";
}

export const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started. 🚀",
  "Study hard what interests you the most in the most undisciplined way. 📚",
  "Education is the passport to the future. 🌟",
  "Push yourself, because no one else is going to do it for you. 💪",
  "Great things never come from comfort zones. 🔥",
  "Dream it. Wish it. Do it. ⚡",
  "Success doesn't just find you. You have to go out and get it. 🎯",
  "The harder you work for something, the greater you'll feel when you achieve it. ✨",
  "Don't stop until you're proud. 🏆",
  "Wake up with determination. Go to bed with satisfaction. 🌙",
];

export function getRandomQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

export function getDaysUntil(date: Date | string): number {
  const d = new Date(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDeadline(date: Date | string): { label: string; urgent: boolean; overdue: boolean } {
  const days = getDaysUntil(date);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, urgent: true, overdue: true };
  if (days === 0) return { label: "Due today", urgent: true, overdue: false };
  if (days === 1) return { label: "Due tomorrow", urgent: true, overdue: false };
  if (days <= 3) return { label: `${days} days left`, urgent: true, overdue: false };
  if (days <= 7) return { label: `${days} days left`, urgent: false, overdue: false };
  return { label: `${days} days left`, urgent: false, overdue: false };
}

export function getAttendanceStatus(percentage: number): {
  color: string;
  label: string;
  danger: boolean;
} {
  if (percentage >= 85) return { color: "text-emerald-400", label: "Excellent", danger: false };
  if (percentage >= 75) return { color: "text-amber-400", label: "Safe", danger: false };
  if (percentage >= 65) return { color: "text-orange-400", label: "Warning", danger: true };
  return { color: "text-rose-400", label: "Critical", danger: true };
}

export function calculateAttendanceNeeded(
  present: number,
  total: number,
  targetPercent = 75
): { needed: number; inNext: number } {
  const currentPct = total > 0 ? (present / total) * 100 : 0;
  if (currentPct >= targetPercent) return { needed: 0, inNext: 0 };
  // Need x classes out of next y classes: present + x >= 0.75 * (total + y)
  // Solve for x when y = x (attend all remaining): present + x = 0.75*(total+x) => x(1-0.75)=0.75*total-present
  const needed = Math.ceil((targetPercent / 100) * total - present) / (1 - targetPercent / 100);
  const neededRounded = Math.ceil(needed);
  return { needed: neededRounded, inNext: neededRounded };
}

export const USER_AVATARS: Record<string, { gradient: string; initials: string }> = {
  default: { gradient: "from-violet-500 to-indigo-500", initials: "U" },
};
