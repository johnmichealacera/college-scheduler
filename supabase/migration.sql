-- Run this in your existing Supabase project SQL Editor.
-- This ONLY creates the two tables that don't exist yet.
-- It reuses your existing: instructors, subjects tables.

-- Rooms (new)
CREATE TABLE IF NOT EXISTS rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Class schedule (new — avoids conflict with existing "schedules" table)
CREATE TABLE IF NOT EXISTS class_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id  uuid REFERENCES subjects(id)     ON DELETE CASCADE NOT NULL,
  teacher_id  uuid REFERENCES instructors(id)  ON DELETE CASCADE NOT NULL,
  room_id     uuid REFERENCES rooms(id)        ON DELETE CASCADE NOT NULL,
  day text NOT NULL CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- RLS for new tables
ALTER TABLE rooms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedule  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduler_allow_all_rooms"           ON rooms           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "scheduler_allow_all_class_schedule"  ON class_schedule  FOR ALL USING (true) WITH CHECK (true);

-- Open policies for existing tables used by the scheduler.
-- If these error with "policy already exists", check pg_policies and
-- ensure your existing policies allow anon/authenticated reads + writes.
CREATE POLICY "scheduler_allow_all_instructors"  ON instructors  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "scheduler_allow_all_subjects"     ON subjects     FOR ALL USING (true) WITH CHECK (true);
