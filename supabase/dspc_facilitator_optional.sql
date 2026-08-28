-- Make DSPC facilitator optional (TBA when still to be arranged).
-- Safe to run on an existing dspc_schedule table. Does not drop data.

ALTER TABLE dspc_schedule
  ALTER COLUMN facilitator_id DROP NOT NULL;

ALTER TABLE dspc_schedule
  DROP CONSTRAINT IF EXISTS dspc_schedule_facilitator_id_fkey;

ALTER TABLE dspc_schedule
  ADD CONSTRAINT dspc_schedule_facilitator_id_fkey
  FOREIGN KEY (facilitator_id) REFERENCES instructors(id) ON DELETE SET NULL;
