# SubTrack — Project Context (claude.md)
> Auto-maintained context file. Updated: 2026-07-13

---

## Project Overview
**SubTrack** is a collaborative academic tracker built with Next.js 14 (App Router), MongoDB (Mongoose), NextAuth, Tailwind CSS, and TypeScript. It is a group study/tracking platform for a small group of students (e.g., 3–4 users in the same account cluster).

**Root:** `d:\SUBTRACKANTI`  
**Dev server:** `npm run dev` (localhost:3000)  
**DB:** MongoDB Atlas — connection string in `.env.local`

---

## Tech Stack
| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth v4 (credentials) |
| DB | MongoDB Atlas via Mongoose |
| Styling | Tailwind CSS v3 + custom globals |
| UI libs | Radix UI, Lucide React, Framer Motion, Recharts, Sonner |
| State | React useState / zustand (minimal) |

---

## Directory Structure
```
src/
├── app/
│   ├── (protected)/          ← All authenticated pages
│   │   ├── layout.tsx        ← Sidebar + Header wrapper
│   │   ├── dashboard/
│   │   ├── subjects/
│   │   ├── assignments/      ← Subject Card-First, priority sorted
│   │   ├── practicals/       ← Subject Card-First, priority sorted
│   │   ├── exams/            ← Subject Card-First, IA1/IA2/Semester tabs
│   │   ├── attendance/       ← Personal, timetable-driven, 4-tab UI
│   │   ├── resources/        ← Subject Card-First, file upload to DB
│   │   ├── tasks/
│   │   ├── syllabus/
│   │   ├── study-sessions/
│   │   ├── calendar/
│   │   ├── stats/
│   │   ├── activity/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── search/
│   ├── (public)/             ← Login / Register pages
│   └── api/
│       ├── assignments/route.ts
│       ├── practicals/route.ts
│       ├── exams/route.ts
│       ├── attendance/route.ts  ← Personal (scoped to session user)
│       ├── timetable/route.ts   ← Per-user timetable
│       ├── resources/route.ts   ← File upload via multipart/form-data
│       ├── subjects/route.ts
│       ├── users/route.ts
│       ├── marks/route.ts
│       ├── submissions/route.ts
│       ├── practical-submissions/route.ts
│       └── ...
├── models/
│   ├── Subject.ts            ← name, colorIndex, creditHours, professor, archived, createdBy
│   ├── Assignment.ts         ← subject, title, description, dueDate, category, priority, files[], createdBy
│   ├── Practical.ts          ← subject, title, description, dueDate, maxMarks, category, createdBy
│   ├── Exam.ts               ← subject, name, examType(IA1|IA2|Semester), date, totalMarks, createdBy [UPDATED]
│   ├── Attendance.ts         ← subject, user, date, status(Present|Absent), markedBy, note [UPDATED]
│   ├── Timetable.ts          ← createdBy, dayOfWeek, period, subject, startTime, endTime [UPDATED per-user]
│   ├── Resource.ts           ← subject, title, type, url, fileData(base64), fileName, fileMime, fileSize, tags[], uploadedBy [UPDATED]
│   ├── Mark.ts               ← exam, user, score, recordedBy
│   ├── Submission.ts         ← assignment, user, isLate, submittedAt
│   ├── PracticalSubmission.ts← practical, user, isLate
│   ├── User.ts               ← name, email, password(hashed), gradient, color
│   ├── Task.ts               ← name, type, deadline, priority, notes, files[], subTasks[], createdBy
│   ├── Syllabus.ts, RevisionTopic.ts, StudySession.ts, ActivityLog.ts, Comment.ts, TaskCompletion.ts
├── components/
│   ├── SubjectHub.tsx         ← Reusable subject card grid (assignments, practicals, exams, resources)
│   ├── Providers.tsx
│   └── layout/
│       ├── Sidebar.tsx        ← navItems list (all routes)
│       └── Header.tsx
├── lib/
│   ├── db.ts                  ← connectDB() with model pre-loading (all 18 models)
│   ├── auth.ts                ← NextAuth authOptions (credentials provider)
│   └── utils.ts               ← cn(), SUBJECT_COLORS[10], PRIORITY_CONFIG, autoPriority(), formatDeadline(), getAttendanceStatus()
└── types/
```

---

## Key Patterns

### Subject Card-First Navigation
Every subject-specific module (Assignments, Practicals, Exams, Resources) uses **SubjectHub** as default view. Click a card → drill into subject data. ArrowLeft → back to hub.

**SubjectHub props:** `subjects`, `selected`, `onSelect`, `countMap`, `countLabel`, `loading`

### autoPriority (automatic priority from due date)
```ts
autoPriority(dueDate) → "Critical" | "High" | "Medium" | "Low"
// Critical: overdue (days < 0)
// High: ≤ 2 days
// Medium: ≤ 6 days
// Low: > 6 days
```
Items sorted by `PRIORITY_ORDER = { Critical:0, High:1, Medium:2, Low:3 }` so urgent items always appear first.

### Attendance System
- **Personal only** — each user marks only their own attendance
- **Timetable-driven** — Mark tab shows classes from the user's own timetable
- **Timetable is per-user** — `createdBy` field on Timetable model
- **4 tabs:** Mark (daily), Overview (stats + skip/need count), Calendar (monthly color view), Timetable (grid editor with time slots Mon-Fri, 8 periods)
- API: `/api/attendance` GET/POST/DELETE all scoped to `session.user.id`

### Exams — IA1 / IA2 / Semester
- `examType: "IA1" | "IA2" | "Semester"` on Exam model
- Page: Subject Card-First → 3 tabs per subject

### Resources — Direct File Upload to DB
- Files stored as **base64** in MongoDB `fileData` field (max 5 MB per file)
- POST: `multipart/form-data` with `file`, `subject`, `title`, `tags`
- GET list: excludes `fileData` (`.select("-fileData")`) to stay light
- Download: `PATCH /api/resources { id }` → returns full object → client decodes base64 → browser download
- Link mode: JSON POST with `type: "link"` and `url`

### SUBJECT_COLORS
Array of 10 objects: `{ bg, text, light, border, hex }`. Index = `subject.colorIndex % 10`.

---

## Environment Variables (.env.local)
```
MONGODB_URI=mongodb://...(Atlas)
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
**No external file storage** (no Cloudinary, S3). Files stored in MongoDB as base64.

---

## Migration Notes
- Old Timetable entries (without `createdBy`) won't appear — users must re-set their timetable.
- Old Attendance records (with `markedBy` only, not `user`) won't appear in personal view.
- Old Exam records without `examType` get Mongoose default `"IA1"`.

---

## Recent Changes (2026-07-13)
1. `Exam.ts` → added `examType: IA1|IA2|Semester`
2. `Resource.ts` → added `fileData, fileName, fileMime, fileSize`
3. `Timetable.ts` → added `createdBy` (per-user)
4. `Attendance.ts` → fixed enum casing (`Present/Absent`), added `note`
5. `api/timetable/route.ts` → filtered by `createdBy`
6. `api/attendance/route.ts` → fully personal (scoped to session user)
7. `api/resources/route.ts` → multipart upload + PATCH for download
8. `exams/page.tsx` → Subject Card-First + IA1/IA2/Semester tabs + marks %
9. `resources/page.tsx` → Subject Card-First + file upload UI
10. `attendance/page.tsx` → 4-tab personal system + calendar view
11. `assignments/page.tsx` → sorted by autoPriority
12. `practicals/page.tsx` → sorted by autoPriority
13. `next.config.mjs` → API body limit 10 MB
