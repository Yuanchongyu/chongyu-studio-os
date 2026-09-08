-- Chongyu Studio OS v1 schema
create extension if not exists pgcrypto;

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  age int,
  current_level text,
  current_project text,
  status text not null default 'active' check (status in ('active','paused','completed')),
  progress int default 0 check (progress between 0 and 100),
  parent_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  lesson_number int,
  lesson_date date,
  title text not null,
  plan text,
  raw_notes text,
  summary text,
  achievement text,
  difficulty text,
  next_step text,
  ai_generated boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists student_skills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  skill_name text not null,
  score numeric(4,2) check (score between 0 and 10),
  confidence numeric(4,2) default 0.5 check (confidence between 0 and 1),
  evidence text,
  source_lesson_id uuid references lessons(id) on delete set null,
  updated_at timestamptz default now(),
  unique(student_id, skill_name)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete set null,
  name text not null,
  summary text,
  repo_url text,
  architecture_notes text,
  latest_commit text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  artifact_type text not null,
  title text,
  storage_bucket text,
  storage_path text,
  external_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists parent_updates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  update_type text default 'lesson',
  draft text not null,
  status text default 'draft' check (status in ('draft','approved','sent')),
  created_at timestamptz default now()
);

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text default 'xiaohongshu',
  pillar text,
  hook text,
  body text,
  status text default 'idea' check (status in ('idea','draft','ready','published','archived')),
  source_type text,
  source_id uuid,
  source_label text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists content_metrics (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content_items(id) on delete cascade,
  captured_at timestamptz default now(),
  views int default 0,
  likes int default 0,
  comments int default 0,
  saves int default 0,
  followers_gained int default 0,
  leads int default 0
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  context text,
  decision text not null,
  rationale text,
  status text default 'proposed' check (status in ('proposed','active','superseded','rejected')),
  proposed_by text,
  approved_by text,
  source_type text,
  source_id uuid,
  created_at timestamptz default now(),
  approved_at timestamptz
);

create table if not exists company_brain (
  id uuid primary key default gen_random_uuid(),
  brain_type text not null,
  title text not null,
  body text not null,
  evidence jsonb default '[]'::jsonb,
  status text default 'active' check (status in ('candidate','active','archived')),
  created_by text,
  approved_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists inbox_items (
  id uuid primary key default gen_random_uuid(),
  input_type text not null,
  raw_content text,
  classification jsonb default '{}'::jsonb,
  status text default 'new' check (status in ('new','processed','archived')),
  created_at timestamptz default now()
);

create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  model_provider text not null,
  model_name text,
  agent_name text,
  skill_name text,
  user_request text,
  context_manifest jsonb default '{}'::jsonb,
  output_summary text,
  writeback_manifest jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Useful indexes
create index if not exists lessons_student_date_idx on lessons(student_id, lesson_date desc);
create index if not exists metrics_content_time_idx on content_metrics(content_id, captured_at desc);
create index if not exists brain_type_idx on company_brain(brain_type);
create index if not exists inbox_status_idx on inbox_items(status, created_at desc);

-- Keep updated_at current
create or replace function studio_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ begin
  create trigger students_updated before update on students for each row execute function studio_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger lessons_updated before update on lessons for each row execute function studio_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger projects_updated before update on projects for each row execute function studio_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger content_updated before update on content_items for each row execute function studio_set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger brain_updated before update on company_brain for each row execute function studio_set_updated_at();
exception when duplicate_object then null; end $$;
