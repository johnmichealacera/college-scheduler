-- DSPC (Division Schools Press Conference) schedule.
-- Completely separate from class_schedule / subjects / attendance.
-- Safe to re-run. Drops previous DSPC tables if they exist.
-- If DSPC is already in use, do not re-run this file.
-- To allow TBA facilitators on an existing table, run dspc_facilitator_optional.sql instead.

DROP TABLE IF EXISTS dspc_schedule;
DROP TABLE IF EXISTS dspc_contests;

CREATE TABLE dspc_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contest text NOT NULL CHECK (contest IN (
    'News Writing',
    'Editorial Writing',
    'Editorial Cartooning',
    'Feature Writing',
    'Sci and Tech Writing',
    'Sports Writing',
    'Copyreading and Headline Writing',
    'Photojournalism',
    'Radio Broadcasting',
    'CDP',
    'Online Desktop',
    'TV Broadcasting',
    'Column Writing'
  )),
  language text NOT NULL CHECK (language IN ('ENGLISH', 'FILIPINO')),
  level text NOT NULL CHECK (level IN ('ELEMENTARY', 'SECONDARY')),
  facilitator_id uuid REFERENCES instructors(id) ON DELETE SET NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT dspc_valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX dspc_schedule_contest_idx ON dspc_schedule (contest);
CREATE INDEX dspc_schedule_language_idx ON dspc_schedule (language);
CREATE INDEX dspc_schedule_level_idx ON dspc_schedule (level);
CREATE INDEX dspc_schedule_facilitator_id_idx ON dspc_schedule (facilitator_id);
CREATE INDEX dspc_schedule_room_id_idx ON dspc_schedule (room_id);
CREATE INDEX dspc_schedule_event_date_idx ON dspc_schedule (event_date);

ALTER TABLE dspc_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scheduler_allow_all_dspc_schedule" ON dspc_schedule FOR ALL USING (true) WITH CHECK (true);
