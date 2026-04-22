-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Teachers
create table if not exists teachers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Subjects
create table if not exists subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  teacher_id uuid references teachers(id) on delete set null,
  created_at timestamptz default now()
);

-- Rooms
create table if not exists rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Schedule
create table if not exists schedule (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references subjects(id) on delete cascade not null,
  teacher_id uuid references teachers(id) on delete cascade not null,
  room_id uuid references rooms(id) on delete cascade not null,
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  constraint valid_time_range check (start_time < end_time)
);

-- Row Level Security (allow all for demo — restrict in production)
alter table teachers enable row level security;
alter table subjects enable row level security;
alter table rooms enable row level security;
alter table schedule enable row level security;

create policy "Allow all on teachers" on teachers for all using (true) with check (true);
create policy "Allow all on subjects" on subjects for all using (true) with check (true);
create policy "Allow all on rooms" on rooms for all using (true) with check (true);
create policy "Allow all on schedule" on schedule for all using (true) with check (true);
