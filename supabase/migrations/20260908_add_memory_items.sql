-- Canonical long-term memory for Chongyu Studio OS.
-- Applied to production on 2026-09-08.

create table if not exists public.memory_items (
  id uuid primary key default gen_random_uuid(),
  memory_type text not null,
  entity_type text,
  entity_ref text,
  title text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  source_type text,
  source_ref text,
  importance int not null default 3 check (importance between 1 and 5),
  status text not null default 'candidate' check (status in ('candidate','active','archived')),
  created_by text,
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memory_items_type_idx on public.memory_items(memory_type);
create index if not exists memory_items_entity_idx on public.memory_items(entity_type, entity_ref);
create index if not exists memory_items_status_importance_idx on public.memory_items(status, importance desc, updated_at desc);

alter table public.memory_items enable row level security;
revoke all on table public.memory_items from anon, authenticated;

do $$ begin
  create trigger memory_items_updated before update on public.memory_items
  for each row execute function studio_set_updated_at();
exception when duplicate_object then null; end $$;
