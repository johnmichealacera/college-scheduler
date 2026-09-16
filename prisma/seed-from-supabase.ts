// One-time import of the data exported from the old Supabase project
// (see prisma/seed-data/*.json, captured 2026-09-16) into this app's tables
// on the shared Neon database.
//
// Run manually, once, after `prisma db push` + `prisma generate`:
//   npx tsx prisma/seed-from-supabase.ts
//
// Safe to re-run: it only INSERTs into instructors/subjects/rooms/
// class_schedule/dspc_schedule, and skips itself if class_schedule already
// has rows (so it won't create duplicates on a second run).
//
// Old rows used Supabase-generated UUIDs; new rows use Prisma cuids, so this
// builds old-id -> new-id maps as it goes and rewrites foreign keys through them.

import { PrismaClient } from "../src/generated/prisma";
import instructorsData from "./seed-data/instructors.json";
import subjectsData from "./seed-data/subjects.json";
import roomsData from "./seed-data/rooms.json";
import classScheduleData from "./seed-data/class_schedule.json";
import dspcScheduleData from "./seed-data/dspc_schedule.json";

const db = new PrismaClient();

type SupabaseInstructor = { id: string; full_name: string; email: string | null; user_id: string | null; created_at: string };
type SupabaseSubject = { id: string; name: string; code: string | null; max_capacity: number; instructor_id: string | null; created_at: string };
type SupabaseRoom = { id: string; name: string; created_at: string };
type SupabaseClassSchedule = { id: string; subject_id: string; teacher_id: string; room_id: string; day: string; start_time: string; end_time: string; created_at: string };
type SupabaseDspcSchedule = { id: string; contest: string; language: string; level: string; facilitator_id: string | null; room_id: string; event_date: string; start_time: string; end_time: string; created_at: string };

function timeToDate(hms: string): Date {
  return new Date(`1970-01-01T${hms}Z`);
}

async function main() {
  const existing = await db.classSchedule.count();
  if (existing > 0) {
    console.log(`class_schedule already has ${existing} rows — skipping import (already run).`);
    return;
  }

  const instructorIdMap = new Map<string, string>();
  for (const row of instructorsData as SupabaseInstructor[]) {
    const created = await db.instructor.create({
      data: {
        fullName: row.full_name,
        email: row.email,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
      },
    });
    instructorIdMap.set(row.id, created.id);
  }
  console.log(`Imported ${instructorIdMap.size} instructors.`);

  const roomIdMap = new Map<string, string>();
  for (const row of roomsData as SupabaseRoom[]) {
    const created = await db.room.create({
      data: { name: row.name, createdAt: new Date(row.created_at) },
    });
    roomIdMap.set(row.id, created.id);
  }
  console.log(`Imported ${roomIdMap.size} rooms.`);

  const subjectIdMap = new Map<string, string>();
  for (const row of subjectsData as SupabaseSubject[]) {
    const created = await db.subject.create({
      data: {
        name: row.name,
        code: row.code,
        maxCapacity: row.max_capacity,
        instructorId: row.instructor_id ? instructorIdMap.get(row.instructor_id) ?? null : null,
        createdAt: new Date(row.created_at),
      },
    });
    subjectIdMap.set(row.id, created.id);
  }
  console.log(`Imported ${subjectIdMap.size} subjects.`);

  let scheduleCount = 0;
  for (const row of classScheduleData as SupabaseClassSchedule[]) {
    const subjectId = subjectIdMap.get(row.subject_id);
    const teacherId = instructorIdMap.get(row.teacher_id);
    const roomId = roomIdMap.get(row.room_id);
    if (!subjectId || !teacherId || !roomId) {
      console.warn(`Skipping class_schedule row ${row.id} — unresolved reference.`);
      continue;
    }
    await db.classSchedule.create({
      data: {
        subjectId,
        teacherId,
        roomId,
        day: row.day,
        startTime: timeToDate(row.start_time),
        endTime: timeToDate(row.end_time),
        createdAt: new Date(row.created_at),
      },
    });
    scheduleCount++;
  }
  console.log(`Imported ${scheduleCount} class_schedule entries.`);

  let dspcCount = 0;
  for (const row of dspcScheduleData as SupabaseDspcSchedule[]) {
    const roomId = roomIdMap.get(row.room_id);
    if (!roomId) {
      console.warn(`Skipping dspc_schedule row ${row.id} — unresolved room reference.`);
      continue;
    }
    await db.dspcSchedule.create({
      data: {
        contest: row.contest,
        language: row.language,
        level: row.level,
        facilitatorId: row.facilitator_id ? instructorIdMap.get(row.facilitator_id) ?? null : null,
        roomId,
        eventDate: new Date(`${row.event_date}T00:00:00Z`),
        startTime: timeToDate(row.start_time),
        endTime: timeToDate(row.end_time),
        createdAt: new Date(row.created_at),
      },
    });
    dspcCount++;
  }
  console.log(`Imported ${dspcCount} dspc_schedule entries.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
