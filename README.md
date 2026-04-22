# ClassSync — School Scheduling System

A full-stack school schedule management system built with React, TypeScript, and Supabase. Administrators can manage teachers, subjects, and rooms, then build a weekly timetable with automatic conflict detection.

## Tech Stack

| | |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| Database | Supabase (PostgreSQL + RLS) |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Routing | React Router v7 |
| Icons | Lucide React |

## Features

- **Dashboard** — live stats, today's classes, conflict overview
- **Teachers / Subjects / Rooms** — full CRUD with modal forms
- **Schedule** — weekly timetable grid (Mon–Fri, 8am–9pm)
- **Conflict detection** — flags teacher or room double-bookings in real time before saving
- **Suggested slots** — when a conflict is found, click an available time slot to auto-fill the form
- **Filters** — filter the timetable by teacher or room

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the migration on your existing Supabase project

This app reuses your existing `instructors` and `subjects` tables.
It only needs two new tables (`rooms` and `class_schedule`).

In your Supabase dashboard → **SQL Editor**, run the contents of:

```
supabase/migration.sql
```

> Do **not** run `supabase/schema.sql` — that file assumes a blank database and will conflict with your existing `subjects` and `instructors` tables.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

See [Where to find your credentials](#where-to-find-your-credentials) below.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### How existing tables are used

| App concept | DB table | Notes |
|---|---|---|
| Teachers | `instructors` | `full_name` column mapped to `name` in app |
| Subjects | `subjects` | `instructor_id` column mapped to `teacher_id` in app |
| Rooms | `rooms` | New table created by migration |
| Schedule | `class_schedule` | New table — avoids conflict with existing `schedules` table |

---

## Where to Find Your Credentials

In your Supabase dashboard:

1. Open your project
2. Go to **Project Settings** (gear icon, bottom-left)
3. Click **API** in the left sidebar
4. You will see:

| Variable | Where to copy from |
|---|---|
| `VITE_SUPABASE_URL` | **Project URL** field |
| `VITE_SUPABASE_ANON_KEY` | **Project API keys → anon public** field |

> The `anon` key is safe to expose in the browser. It is scoped by Row Level Security policies defined in `schema.sql`.

---

## Database Schema

```
teachers   id, name, created_at
subjects   id, name, teacher_id → teachers, created_at
rooms      id, name, created_at
schedule   id, subject_id, teacher_id, room_id, day, start_time, end_time, created_at
```

Run `supabase/schema.sql` to create all tables and RLS policies.

---

## Project Structure

```
src/
├── components/
│   ├── layout/       # Sidebar, Layout, PageHeader
│   ├── ui/           # Button, Input, Select, Modal, Badge
│   ├── teachers/     # TeacherList, TeacherForm
│   ├── subjects/     # SubjectList, SubjectForm
│   ├── rooms/        # RoomList, RoomForm
│   └── schedule/     # SchedulePage, ScheduleForm, WeeklyTimetable, ConflictAlert
├── hooks/            # useTeachers, useSubjects, useRooms, useSchedule
├── lib/
│   ├── supabase.ts   # Supabase client
│   └── utils.ts      # Conflict detection, time helpers
├── pages/            # Dashboard
├── types/            # Shared TypeScript types
└── App.tsx           # Router + QueryClient setup
supabase/
└── schema.sql        # Full database schema
```

## Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```
