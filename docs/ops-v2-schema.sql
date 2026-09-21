-- Ops V2 schema proposal. REVIEW ONLY on ops-v2; do not apply to production yet.
create table if not exists teaching_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active','archived')),
  default_duration_minutes integer,
  default_revenue numeric(10,2),
  default_expected_expense numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists teaching_group_members (
  group_id uuid not null references teaching_groups(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz,
  primary key(group_id,student_id,joined_at)
);
create table if not exists lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references teaching_groups(id),
  title text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
  expected_revenue numeric(10,2) default 0,
  actual_revenue numeric(10,2),
  expected_expense numeric(10,2) default 0,
  actual_expense numeric(10,2),
  payment_method text,
  location text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists lesson_session_students (
  lesson_session_id uuid not null references lesson_sessions(id) on delete cascade,
  student_id uuid not null references students(id),
  student_name_snapshot text not null,
  group_name_snapshot text,
  primary key(lesson_session_id,student_id)
);
create index if not exists lesson_sessions_start_idx on lesson_sessions(start_at);
create index if not exists lesson_session_students_student_idx on lesson_session_students(student_id);
