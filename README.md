# SubTrack — Academic Tracker for 3 Friends

A collaborative, fully-transparent academic tracking web application designed specifically for 3 friends to track their studies together. All 3 users have complete equality and access to add, edit, delete, and view everything.

## Features

- **Maximum Transparency**: Everyone sees everyone's progress. No admin roles.
- **Beautiful UI**: Glassmorphism, modern dark mode, and sleek animations built with Tailwind CSS.
- **Subject Management**: Color-coded subjects with credit tracking.
- **Assignments & Tasks**: Collaborative tracking with individual completion indicators. Visual progress bars show group completion.
- **Exams & Leaderboards**: Track marks and see who performed best in each subject.
- **Attendance Tracker**: Visual indicators when attendance drops below 75% and automatic calculation of needed classes.
- **Resources & Syllabus**: Share links, notes, and PDFs. Track syllabus coverage with visual progress.
- **Study Sessions**: Schedule group study sessions.
- **Activity Log**: Real-time chronological feed of who did what, with emoji reactions.
- **Global Search**: Find anything instantly.
- **Statistics**: Compare completions, averages, and identify the hardest subjects.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Recharts, Lucide Icons, Date-fns, Sonner (Toasts)
- **Backend**: Next.js API Routes
- **Database**: MongoDB (Mongoose)
- **Authentication**: NextAuth.js (Credentials Provider)

---

## 🚀 Setup & Installation

### 1. Database Setup (MongoDB Atlas or Railway)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (or [Railway](https://railway.app/)).
2. Create a new cluster and database named `subtrackanti`.
3. Get your connection string (e.g., `mongodb+srv://<username>:<password>@cluster.mongodb.net/subtrackanti`).

### 2. Environment Variables Configuration
Create a `.env.local` file in the root of your project based on the provided template:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/subtrackanti?retryWrites=true&w=majority

# NextAuth Secret (Generate a secure random string)
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# NextAuth URL
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Create the 3 Users (Database Seeding)
This application is hardcoded for 3 specific friends. To create their accounts in the database, run the seed script:
```bash
npm run seed
```
*Note: You can modify the user details (names, emails, colors) in `src/scripts/seed.ts` before running the script if you wish.*

Default credentials for testing:
- **Owais**: `owaishussain259@gmail.com` / `12345678`
- **Nofil**: `shaikh.nofil.07@gmail.com` / `12345678`
- **Kunal**: `kunal.j9921@gmail.com` / `12345678`

### 5. Run the Application locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment Instructions (Vercel)

### Deploying the App to Vercel
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and create a "New Project".
3. Import your GitHub repository.
4. **Important**: Add the following Environment Variables in the Vercel dashboard:
   - `MONGODB_URI`: Your production database URL.
   - `NEXTAUTH_SECRET`: A strong secret key (e.g., generated via `openssl rand -base64 32`).
   - `NEXTAUTH_URL`: Your actual Vercel domain (e.g., `https://subtrackanti.vercel.app`).
   - `NEXT_PUBLIC_APP_URL`: Your actual Vercel domain.
5. Click **Deploy**.

*Note: Since Vercel uses serverless functions, database connections can spike. The Mongoose connection string in this app (`src/lib/db.ts`) already implements connection caching to prevent connection exhaustion.*

---

## 🎨 UI/UX Highlights
- **Design System**: Built around `hsl` custom properties injected via `globals.css`.
- **Theming**: Dark mode default, with `next-themes` powering system/light/dark toggles.
- **Glassmorphism**: `.glass` utility class applying `backdrop-blur-xl` and transparent backgrounds.
- **Mobile Friendly**: Sidebar transforms into an off-canvas menu on small screens.
- **Responsiveness**: All tables, grids, and charts are fully responsive.
